const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {login}= require('../../../models/login');
const {Token} = require('../../../models/token');
const {isAdmin} = require('../../../controllers/middleware');
const { categorymodel } = require('../../../models/carcategorySchema');
const {carmodel}=require('../../../models/carSchema');

const multer =require('multer');
// Multer setup
const path = require('path');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const uploads = multer({ storage: storage });












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
        { expiresIn: '5h' });  `    `
        
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

router.post('/add-category', isAdmin,uploads.single('image'), async(req,res)=>{
    try {
        const { name, description} = req.body;
        

        // validate required field
        if(!name){
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
            image:req.file.filename
        });

        await category.save();

        res.status(201).json({message: 'Category added successfully', category});


        
    } catch (error) {

        console.log('add category error:',error);
        res.status(500).json({message: 'Internal Server Error'});
        
    }
});

//Read alll categories by admin


router.get('/getcategories',isAdmin,async(req,res)=>{
    try {

       

            const categories = await categorymodel.find({status:true});
            res.status(200).json({status:true, message:'Categories fetched successfully',
                categories:categories
            });
    }
        
     catch (error) {
        console.error(error);
        res.status(500).json({status: false, message: 'Something went wrong'});
        
    }
});

//Update category  by admin

router.put('/updatecategory/:id', isAdmin,uploads.single('image'),async(req,res)=>
{
    try {

        const {id}  = req.params;
        const {name,description}= req.body;
        

        // All fields to update should be in one object
         const updateFields = { name, description };
         
        // If a new image was uploaded, update it
        if (req.file) {
        updateFields.image = req.file.filename;
        }


        const updatecategory = await categorymodel.findByIdAndUpdate(id,
            updateFields,
            

            {new:true}

        );
        if(!updatecategory) {
            return res.status(404).json({ status: false, message: 'Category not found' });
        }

        res.status(200).json({status:true,message:'Category updated successfully',
            category:updatecategory
        });

        
    } catch (error
    )
     { console.log(error)
         res.status(500).json({ status: false, message: 'Something went wrong' });
        
    }
});



//delete category
router.delete('/deletecategory/:id',isAdmin,async(req,res)=>{
    try{
        const {id} = req.params;

        //soft delete
        const deletecategory = await categorymodel.findByIdAndUpdate(
            id,
            {status : false},
            {new: true}
        );

        if(!deletecategory)
            {
            return req.status(400).json({status : false, message:"Category not found"});
        }
        res.status(200).json({status : true,message:'DELETED SUCCESSFULLY',
            category:deletecategory
        });

    }
    catch(error){
        console.log(error)
        res.status(500).json({status: false, message:'Something went wrong'})
    }
});


// route to add cars

router.post('/add-car', isAdmin, uploads.single('image'), async (req, res) => {
  try {
    const { carName, categoryId, rentPerDay, description,totalUnits } = req.body;


    // Check if category exists
    const category = await categorymodel.findById(categoryId);
    if (!category) {
      return res.status(404).json({ status: false, message: 'Category not found' });
    }

    // Check for duplicate car in the same category
    const existingCar = await carmodel.findOne({ carName, category: categoryId });
    if (existingCar) {
      return res.status(400).json({ status: false, message: 'Car with this name already exists in the selected category' });
    }

    // Create and save new car
    const newCar = new carmodel({
      carName,
      category: categoryId,
      rentPerDay,
      totalUnits:totalUnits,
      availableUnits:totalUnits,
      image: [req.file.filename],
      description
    });
    await newCar.save();

    // this will update category totals
    category.totalCars += Number(totalUnits);
    category.availableCars += Number(totalUnits);
    await category.save();

    

    res.status(201).json({ status: true, message: 'Car added successfully', car: newCar });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
});


// read cars by admin

router.get('/all-cars', isAdmin, async (req, res) => {
  try {
    const cars = await carmodel.find();
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});


// update cars
router.put('/update-car/:id', isAdmin, uploads.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { totalUnits, availableUnits } = req.body;

    const total = Number(totalUnits);
    const available = Number(availableUnits);

    if (isNaN(total) || isNaN(available)) {
      return res.status(400).json({ status: false, message: 'totalUnits or availableUnits is not a number' });
    }

    const updateFields = {
      totalUnits: total,
      availableUnits: available,
    };

    if (req.file) {
      updateFields.image = req.file.filename;
    }

    const car = await carmodel.findByIdAndUpdate(id, updateFields, { new: true });
    if (!car) {
      return res.status(404).json({ status: false, message: 'Car not found' });
    }

    // Update Category Totals
    const category = await categorymodel.findById(car.category);
    if (category) {
      // Get all cars under the same category to recalculate totals
      const allCars = await carmodel.find({ category: car.category });

      category.totalCars = allCars.reduce((sum, car) => sum + (car.totalUnits || 0), 0);
      category.availableCars = allCars.reduce((sum, car) => sum + (car.availableUnits || 0), 0);

      await category.save();
    }

    res.status(200).json({
      status: true,
      message: 'Car updated and category totals adjusted successfully',
      car,
    });

  } catch (error) {
    console.error('Update car error:', error);
    res.status(500).json({ status: false, message: 'Something went wrong' });
  }
});






module.exports = router;

