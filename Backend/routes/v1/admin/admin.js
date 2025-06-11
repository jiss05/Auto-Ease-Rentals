const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {login}= require('../../../models/login');
const {Token} = require('../../../models/token');
const {isAdmin} = require('../../../controllers/middleware');
const { categorymodel } = require('../../../models/carcategorySchema');










// secret key for JWT
const JWT_SECRET = '@this_is_secret_key';

// secret code for admin registration
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'your-very-secret-code';

// admin registration route 
router.post('/register', async (req, res) => {
    try {

        const { email, password, phoneno, name,role } = req.body;

        if (!email || !password || !phoneno || !name) {
            return res.status(400).json({ status: false, message: 'All fields are required' });
        }
        // check name should be alphanumeric characters only
        if(!/^[a-zA-Z0-9 ]+$/.test(name)) {
            return res.status(400).json({ status: false, message: 'Name should be alphanumeric characters only' });
        }
        // check if email is already registered
        const existingUser = await login.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ status: false, message: 'Email already registered' });
        }
        // check phone nbr must contain 10 digits
        if (!/^\d{10}$/.test(phoneno)) {
            return res.status(400).json({ status: false, message: 'Phone number must contain 10 digits' });
        }
        // Chk if phone NBR is already registered  
        const existingPhone = await login.findOne({ phoneno: phoneno });
        if (existingPhone) {
            return res.status(400).json({ status: false, message: 'Phone number already registered' });
        }
        // email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ status: false, message: 'Invalid email format' });
        }
        // role validation
        const allowedroles = ['admin', 'user'];
        if (!allowedroles.includes(role.toLowerCase()))
        {
            return res.status(400).json({ status : false, message: 'Role must be either admin or user'});

        }





        // Admin registration requires secret code

        let isverified = false;
        if (role.toLowerCase() === 'admin') {   
            if(req.body.adminSecret!==ADMIN_SECRET) {
                return res.status(400).json({ status: false, message: 'Unauthorized to register as admin' });
            }
            isverified = true; // Admins are verified by default
        }








       

        // hash the password
        const newpassword = await bcrypt.hash(password, 10);
        const newuser = new login({
            name: name,
            email: email,
            password: newpassword,
            phoneno: phoneno,
            role: role,
            isverified: isverified

        });
        // save the new user
        await newuser.save();


        // generate JWT token
        const token = jwt.sign({ id: newuser.id, role: newuser.role, email: newuser.email }
            , JWT_SECRET,
             { expiresIn: '1h' });



        //save the token in the database
        const tokenentry = new Token({login_id: newuser.id,token:token});
        await tokenentry.save();

        res.status(201).json({status:false,
            message:'Admin Regestered Successfully',
            token: token});
        
        
    } catch (error) {

        console.log(error);
        res.status(500).json({ status: false, message: 'Something went wrong' });
        
    }
});

// AdMin Login route


router.post('/login',async (req,res)=>
{

    try {

        const{email,password}=req.body;
        if(!email || !password) {
            return res.status(400).json({ status: false, message: 'Email and password are required' });
        }

        // validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ status: false, message: 'Invalid email format' });
        }

        //validate passwordmust contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
            return res.status(400).json({ status: false, message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character' });
        }
        // check if email is in database
        const user = await login.findOne({email});
        if (!user) {
            return res.status(400).json({ status: false, message: 'user not found' });
        }
        // check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: false, message: 'Invalid password' });
        }
        // generate JWT token
        const token = jwt.sign({ id: user.id, role: user.role, email: user.email },
         JWT_SECRET,
        { expiresIn: '1h' });  
        
        //save

        const tokenentry = new Token({ login_id: user.id, token: token });
        await tokenentry.save();
        // show a success message
        res.status(200).json({
            status: true,
            message: 'Login successful',
            token
        });

        
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: 'Something went wrong' });

        
    }
});


//add category by admin

router.post('/add-category', isAdmin, async(req,res)=>{
    try {
        const { name, description, totalCars, availableCars, image } = req.body;
        

        // validate required field
        if(!name || totalCars ==  null){
            return res.status(400).json({message:'Name and totalCars are required'});

            
        }

        //check if the category already exist
        const existing = await categorymodel.findOne({name});
        if(existing){
            return res.status(400).json({message: 'Category already exists'});

        }

        // create a new category

        const category=new categorymodel({
            name,
            description,
            totalCars,
            availableCars: availableCars ?? totalCars,
            image
        })

        await category.save();

        res.status(201).json({message: 'Category added successfully', category});


        
    } catch (error) {

        console.log('add category error:',error);
        res.status(500).json({message: 'Internal Server Error'});
        
    }
});



module.exports = router;
