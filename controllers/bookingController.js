import User from "../models/UserSchema.js"
import Booking from '../models/BookingSchema.js';
import Doctor from '../models/DoctorSchema.js'
import Stripe from 'stripe'

export const getCheckOutSession = async (req,res)=>{

    try{

        //get current booked doctor
        const doctor =await Doctor.findById(req.params.doctorId)
        const user = await User.findById(req.userId)
       
        const stripe = new Stripe(process.env.SRTIPE_SECRET_KEY)
        //create stripe checkout session 
       const session =await stripe.checkout.sessions.create({
        payment_method_types:['card'],
        mode:'payment',
        success_url:`${process.env.Client_SITE_URL}/checkout-success`,
        Cancel_url:`${req.protocol}://${req.get('host')}/doctors/`,
        customer_email:user.email,
        client_reference_id:req.params.doctorId,
        line_items:[
            {
                price_data:{
                    currency:'bdt',
                    unit_amount:doctor.ticketPrice * 100,
                    product_data:{
                        name:doctor.name,
                        description:doctor.bio,
                        images:[doctor.photo]

                    }

                },
                quantity:1    
            }
            
        ]

    })

    //create new booking
    const booking= new Booking({
        doctor:doctor._id,
        user:user._id,
        ticketPrice:doctor.ticketPrice,
        session:session.id
    })

    await booking.save()

    res.status(200).json({success:true, message:"successfully paid", session})

    } catch(err){
        res.send(500).json({success:false, message:"Error creating checkout session"})


    }
}