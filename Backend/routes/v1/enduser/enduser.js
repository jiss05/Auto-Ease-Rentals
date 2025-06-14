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
const {bookingmodel}=require('../../../models/bookingschema');
const {categorymodel}= require('../../../models/carcategorySchema');
const {cartmodel} = require('../../../models/cartschema');
const{carmodel} = require('../../../models/carSchema');



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





// Get all car categories (for user selection)
router.get('/categories', isUser, async (req, res) => {
  try {
    // Fetch categories where status is true (i.e., active)
    const categories = await categorymodel.find({ status: true });

    if (!categories || categories.length === 0) {
      return res.status(404).json({ status: false, message: 'No categories found' });
    }

    // Send back only the necessary data
    const categoryList = categories.map(cat => ({
      id: cat._id,
      name: cat.name,
      description: cat.description,
      totalCars: cat.totalCars,
      availableCars: cat.availableCars,
      image: cat.image || null
    }));

    res.status(200).json({
      status: true,
      message: 'Categories fetched successfully',
      categories: categoryList
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
});




// GET cars by category name
router.get('/allcars', async (req, res) => {
  try {
    const categoryQuery = req.query.category;

    if (!categoryQuery) {
      return res.status(400).json({ status: false, message: 'Category name or ID is required' });
    }

    // Detect if it's an ID
    const isObjectId = mongoose.Types.ObjectId.isValid(categoryQuery);

    let category;
    if (isObjectId) {
      category = await categorymodel.findById(categoryQuery);
    } else {
      category = await categorymodel.findOne({
        name: { $regex: new RegExp('^' + categoryQuery + '$', 'i') }
      });
    }

    if (!category) {
      return res.status(404).json({ status: false, message: 'Category not found' });
    }

    const cars = await carmodel.find({ category: category._id }); // No isDeleted filter

    return res.status(200).json({
      status: true,
      message: 'All cars fetched successfully',
      category: category.name,
      cars: cars
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Server Error' });
  }
});



/// POST route to add a car to a user's cart
router.post('/add-to-cart', isUser, async (req, res) => {
  try {
    // Destructure carId and quantity from request body
    const { carId, quantity } = req.body;

    // Get the logged-in user's ID from middleware (decoded from token)
    const userId = req.user._id;

    // Validate that both carId and quantity are provided
    if (!carId || !quantity) {
      return res.status(400).json({ status: false, message: "All fields are required" });
    }

  

    // Check if the car exists in the database and is not soft deleted
    const car = await carmodel.findById(carId);
    if (!car || car.isDeleted) {
      return res.status(404).json({ status: false, message: "Car not found or deleted" });
    }
      if (quantity > car.availableUnits) {
  return res.status(400).json({
    status: false,
    message: `Only ${car.availableUnits} units available`
  });
}

        //Check availability
    if (car.totalUnits === 0 || car.availableUnits === 0) {
  return res.status(400).json({
    status: false,
    message: "This car is not available now"
  });
}

    // Try to find an existing cart for the current user
    let cart = await cartmodel.findOne({ user: userId });

    if (cart) {
      // If cart exists, check if the selected car is already in the cart
      const itemIndex = cart.items.findIndex(item => item.car.toString() === carId);

      if (itemIndex > -1) {
        // If car is already in the cart, increase the quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // If not in cart, add the car as a new item
        cart.items.push({ car: carId, quantity });
      }
    } else {
      // If cart doesn't exist, create a new cart for the user with this car
      cart = new cartmodel({ user: userId, items: [{ car: carId, quantity }] });
    }

    // Save the updated or newly created cart
    await cart.save();

            const updatedCart = await cartmodel
        .findOne({ user: userId })
        .populate({
            path: 'items.car',
            populate: {
            path: 'category',
            model: 'category'
            }
        });

        // Find the item just added or updated
        const selectedItem = updatedCart.items.find(item => item.car._id.toString() === carId);

        if (!selectedItem) {
        return res.status(404).json({ status: false, message: "Car not found in cart" });
        }

        // Prepare values
        const carName = selectedItem.car.carName;
        const carIdResp = selectedItem.car._id;
        const categoryName = selectedItem.car.category.name;
        const price = selectedItem.car.rentPerDay;
        const quantitySelected = selectedItem.quantity;
        const totalAmount = price * quantitySelected;

        // Return only required data
        res.status(200).json({
        status: true,
        message: "Car added to cart",
        carId: carIdResp,
        carName,
        category: categoryName,
        quantity: quantitySelected,
        totalAmount
        });

  } catch (error) {
    // Log any unexpected error and send a generic error response
    console.error(error);
    res.status(500).json({ status: false, message: "Something went wrong" });
  }
});



//view cart by user

router.get('/cart', isUser, async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await cartmodel.findOne({ user: userId }).populate({
      path: 'items.car',
      populate: { path: 'category' }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        status: true,
        message: 'Cart is empty',
        cart: []
      });
    }

    const cartData = cart.items.map(item => {
      const car = item.car;
      return {
        carId: car._id,
        carName: car.carName,
        category: car.category?.name || 'N/A',
        rentPerDay: car.rentPerDay,
        quantity: item.quantity,
        amount: item.quantity * car.rentPerDay
      };
    });

    const totalAmount = cartData.reduce((sum, item) => sum + item.amount, 0);

    return res.status(200).json({
      status: true,
      message: 'Cart fetched successfully',
      cart: cartData,
      totalAmount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: 'Something went wrong' });
  }
});



router.put('/update-cart', isUser, async (req, res) => {
  try {
    const { carId, quantity } = req.body;
    const userId = req.user._id;

    if (!carId || quantity === undefined) {
      return res.status(400).json({ status: false, message: "Car ID and quantity are required" });
    }

    const car = await carmodel.findById(carId);
    if (!car || car.isDeleted) {
      return res.status(404).json({ status: false, message: "Car not found or deleted" });
    }

    let cart = await cartmodel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ status: false, message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(item => item.car.toString() === carId);
    if (itemIndex === -1) {
      return res.status(404).json({ status: false, message: "Car not found in cart" });
    }

    const previousQty = cart.items[itemIndex].quantity;

    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
      await cart.save();
      return res.status(200).json({ status: true, message: "Item removed from cart" });
    }

    // Check availability
    if (quantity > car.availableUnits) {
      return res.status(400).json({
        status: false,
        message: `Only ${car.availableUnits} units available`
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // Create custom message
    let diff = quantity - previousQty;
    let actionMsg =
      diff > 0
        ? `${diff} item(s) added`
        : `${Math.abs(diff)} items removed`;

    return res.status(200).json({
      status: true,
      message: actionMsg,
      updatedQuantity: quantity
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: "Something went wrong" });
  }
});




module.exports=router;




