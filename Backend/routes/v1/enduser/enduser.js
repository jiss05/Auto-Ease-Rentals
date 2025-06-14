const express = require('express');
const router = express.Router();


const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const pdf = require('pdfmake');
const jwt = require('jsonwebtoken');

const{login : usermodel} =require('../../../models/login');
const {isUser}= require('../../../controllers/middleware');

const{Token}= require('../../../models/token');
const{Otp}= require('../../../models/otp');
const sendEmail = require('../../../controllers/email');
const bookingmodel=require('../../../models/bookingschema');
const {categorymodel}= require('../../../models/carcategorySchema');



// token

const JWT_SECRET='@this_is_secret_key'

// User Registration Route
router.post('/register', async (req,res )=>{
    try {
        const { email,password,phoneno,name,role} = req.body;
        if (!email || !password || !phoneno || !role || !name) {
            return res.status(400).json({ status: false, message: 'All fields required' });
        }
        if (!/^[a-zA-Z0-9]+$/.test(name)) {
            return res.status(400).json({ status: false, message: 'Name should contain only alphanumeric characters' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ status: false, message: 'Invalid email format' });
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password)) {
            return res.status(400).json({ status: false, message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character' });
        }
        if (!/^\d{10}$/.test(phoneno)) {
            return res.status(400).json({ status: false, message: 'Phone number must be exactly 10 digits' });
        }
        const allowedRoles = ['user'];
        if (!allowedRoles.includes(role.toLowerCase())) {
            return res.status(400).json({ status: false, message: 'Role must be one of: user' });
        }
         // Check if user already exists
        const existingUser = await usermodel.findOne({ email: email, status: true });
        if (existingUser && existingUser.isverified) {
            return res.status(400).json({ status: false, message: 'User already exists with this email' });
        }

        // hash the password
        
        const newpassword = await bcryptjs.hash(password, 10);

        //generate the otp
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

        // delete any existing OTP for this user
        await Otp.deleteMany({ email: email });

        if(!existingUser){
        const newuser = new usermodel({
            name: name,
            password: newpassword,
            role: role,
            email: email,
            phoneno: phoneno
        });
        await newuser.save();}
        else{
            existingUser.name = name;
            existingUser.password = newpassword;
            existingUser.role = role;
            existingUser.phoneno = phoneno;
            await existingUser.save();
        }

        //to get the user id
        const newuser = await usermodel.findOne({ email: email, status: true });


        // Save the OTP to the database
        const newOtp = new Otp({
            Loginid: newuser._id, // Use existing user ID or new user ID
            otp: otp,
            email: email,
            expiresAt: otpExpiry
        });

        await newOtp.save();
        // Send the OTP to the user's email

        await sendEmail.sendTextEmail(email, 'Your OTP Code', `Your OTP code is ${otp}. It is valid for 5 minutes.`);
         res.status(200).json({ status: true, message: 'OTP send Successfully' });
    }catch(error){
        console.log(error);
        res.status(500).json({status:false,message:'Internal server error'});
    }
});

//verify otp
router.post('/verify',async(req,res)=>{
    try {
        const userOtp = req.body.otp;
        const {email}= req.body;


        const mainadmin = await usermodel.findOne({role: 'user', status: true});

         if(!userOtp || !email) {
            return res.status(400).json({ status: false, message: 'OTP and email are required' });
        }
        const verifyotp= await Otp.findOne({ email});
        if (!verifyotp) {
            return res.status(400).json({ status: false, message: 'OTP not found for this email' });
        }

         //checking the otp is correct
        if (verifyotp.otp !== userOtp) {
            return res.status(400).json({ status: false, message: 'Invalid OTP' });
        }


         //checking the otp is expired
        if (verifyotp.expiresAt < new Date()) {
            return res.status(400).json({ status: false, message: 'OTP has expired' });
        }

        if(verifyotp.otp === userOtp) {
            // Update user status to verified
            await usermodel.updateOne(
                { email: email },
                { $set: { isverified: true, status: true } }
            );


    
            const verifieduser = await usermodel.findOne({ _id: verifyotp.Loginid });
            
            //send to admin
            await sendEmail.sendTextEmail(mainadmin.email, 'New User Registration', `A new user has registered with the email: ${email}. Please verify their account.`);                

            return res.status(200).json({status:true, message:"OTP verified and user activated"});

    }
    else{
        return res.status(400).json({
            status:false,
            message:"Invalid OTP"

        });
    }

        
    } catch (error) {


         console.log(error);
        return res.status(500).json({
            status:false,
            message:"Something went wrong"
        });
        
    }
});


//user login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🚫 Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ status: false, message: 'Email and password are required' });
    }

    // 🔍 Find the user by email and make sure the account is active (status: true)
    const user = await usermodel.findOne({ email: email, status: true });
    if (!user) {
      return res.status(401).json({ status: false, message: 'Invalid email or password' });
    }

    // 🔐 Compare entered password with hashed password from DB
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ status: false, message: 'Invalid email or password' });
    }

    // 🔑 Generate JWT token with user ID and role info
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,            // secret key (should be in env)
      { expiresIn: '1d' }    // token is valid for 1 day
    );

    // 💾 Save generated token into tokens collection
    const newToken = new Token({
      login_id: user._id,  // Reference to login model
      token: token
    });
    await newToken.save();

    // ✅ Return success response with token
    res.status(200).json({
      status: true,
      message: 'Login successful',
      token: token
    });

  } catch (error) {
    console.log(error);  // helpful during development
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
});


module.exports=router;




