import jwt from 'jsonwebtoken'
import  Doctor from '../models/DoctorSchema.js'
import User from '../models/UserSchema.js'

export const authenticate =async (req,res,next)=>{
    //get token from headers
    const authToken =req.headers.authorization;

    //check the token is exists
    if (!authToken || !authToken.startsWith("Bearer")){
        return res.status(401).json({success:false, message:"NO token, authorization failed"});

    }
    try{
        const token =authToken.split(' ')[1];

        //verify token
        const decoded= jwt.verify(token,process.env.JWT_SECRET_KEY)

        req.userId= decoded.id
        req.role= decoded.role
        next();
    }  catch(err){

        if (err.name=='TokenExpiredError'){
            return res.status(401).json({message:'Token is expired'}
            )}
            return res.status(401).json({success: false, message:"Invalid token"}
            )
        
    }
};

export const restrict = (roles) => async (req, res, next) => {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized: No user ID found" });
    }

    let user = await User.findById(userId) || await Doctor.findById(userId);

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!roles.includes(user.role)) {
        return res.status(403).json({ success: false, message: "You are not authorized" });
    }

    next();
};
