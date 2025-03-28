







//user signup : 
const signUp = async(req , res) =>{
  try {
    const { firstname, lastname, username , email, password} = req.body;
    if(!firstname || !lastname || !username || !email || !password){
      return res.status(400).json({
        error : "All fields are required",
      });
    }
  } catch (error) {
    
  }
}