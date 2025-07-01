const { default: mongoose } = require("mongoose");
const blogs = require("../models/blogsschema");
const { deleteOldImages } = require("../middlewares/S3_bucket");

exports.createBlog = async (req, res) => {
  try {
    const { heading, content, facebook, instagram, twitter } = req.body;
    if (!heading || !content) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "all fields are required",
        error: "Bad Request",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        statuscode: 2,
        message: "blog image is required",
        error: "Bad Request",
      });
    }

    const blogimage = req.file.location;
    const blog_response = await blogs.create({
      userId: req.user._id,
      heading: heading,
      content: content,
      blogimage: blogimage,
      facebook: facebook,
      instagram: instagram,
      twitter: twitter,
    });

    if (!blog_response) {
      return res.status(405).json({
        success: false,
        statuscode: 2,
        message: "unable to create blog",
        error: "Database error",
      });
    }

    return res.status(200).json({
      success: true,
      message: "blog created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server error",
      error: error.message,
    });
  }
};

exports.updateBlogbyId = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "invalid ID",
        error: "Bad Request",
      });
    }
    const updateData = {};
    const allowed_fields = [
      "heading",
      "content",
      "facebook",
      "instagram",
      "twitter",
    ];

    allowed_fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    const blog_response = await blogs.findByIdAndUpdate(
      id,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!blog_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "blog not found or error in updation",
        error: "Database error",
      });
    }

    return res.status(200).json({
      success: true,
      message: "blog updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "invalid ID",
        error: "Bad Request",
      });
    }
    const blog_response = await blogs.findById(id).populate("userId");
    if (!blog_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "blog not found",
        error: "Not Found",
      });
    }
    return res.status({
      success: true,
      statuscode: 3,
      message: "blog retrieved successfully",
      data: blog_response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.deleteBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "invalid ID",
        error: "Bad Request",
      });
    }

    const blog_exist = await blogs.findById(id);
    if (!blog_exist) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "blog not found",
        error: "Not Found",
      });
    }

    const key = decodeURIComponent(
      new URL(blog_response.blogimage).pathname
    ).substring(1);
    await deleteOldImages(key);
    const blog_response = await blogs.findByIdAndDelete(id);
    if (!blog_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "blog not found",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      statuscode: 3,
      message: "blog deleted successfully",
      data: blog_response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getallBlogs = async (req, res) => {
  try {
    const allBlogs_response = await blogs.find().sort({_id: -1}).exec();
    if (!allBlogs_response) {
      return res.status(404).json({
        success: false,
        statuscode: 1,
        message: "Blogs are empty",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "blogs retrieved successfully",
      allBlogs_response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.updateblogPicture = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "invalid ID",
        error: "Bad Request",
      });
    }

    if (!req.file) {
      return res.status(401).json({
        success: false,
        statuscode: 1,
        message: "blog image is required",
        error: "Bad Request",
      });
    }

    const blog_response = await blogs.findById(id).populate("userId");
    if (!blog_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "blog not found",
        error: "Not Found",
      });
    }
    const blogImage = req.file.location;
    if (blog_response.blogimage) {
      const key = decodeURIComponent(
        new URL(blog_response.blogimage).pathname
      ).substring(1);
      await deleteOldImages(key);
    }

    blog_response.blogimage = blogImage;
    await blog_response.save();
    return res.status(200).json({
      success: true,
      statuscode: 3,
      message: "blog image updated successfully",
      data: blog_response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};
