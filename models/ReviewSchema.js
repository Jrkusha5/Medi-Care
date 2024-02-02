import mongoose from "mongoose";
import Doctor from "./DoctorSchema.js";

const reviewSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Types.ObjectId,
      ref: "Doctor",
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    reviewText: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 0,
    },
  },
  { timestamps: true }
);

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path:'user',
    select:'name photo',
  });
  next();
});

reviewSchema.statics.calculateAverageRatings =async function(doctorId){
  //this points the current reviews
  const stats=await this.aggregate([{
    $match:{doctor:doctorId}
  },
  {
    $group:{
      _id:"$doctor",
      numOfString:({$sum:1}),
      avgRatings:{$avg:"string"}
    }
  }
  ])
  await Doctor.findByIdAndUpdate(doctorId,{
    totalRating:stats[0].numOfString,
    averageRating:stats[0].averageRating,
  })
}

reviewSchema.post('save',function(){
  this.constructor.calculateAverageRatings(this.doctor);
})
export default mongoose.model("Review", reviewSchema);
