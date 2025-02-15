const { query } = require("express");
const post = require("../model/post");
const uploadCloudinary = require("../utils/cloudinary");
const fs = require('fs');

//get post
exports.getAllPost = async (req, res) => {
  try {
    const search = req.query.search;
    const options = {
      title: { $regex: search, $options: "i" },
    };
    console.log(query);
    const getpost = await post.find(search ? options : {}).sort({ createdAt: -1 });
   
    if (getpost) {
      return res.status(200).json({
        message: "All posts fetched.",
        data: getpost,
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: "Posts not fetched.",
      error: error,
    });
  }
};

//get post by id
exports.getPost = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const getpost = await post.findById(id);
    if (getpost) {
      return res.status(200).json({
        message: "all post fetched.",
        getpost,
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: "post not fetched.",
    });
  }
};


//create post
exports.createPost = async (req, res) => {
  try {
    const { title, description, category, userId, author } = req.body;
    const filePath = req.file ? req.file.path : null;


    if (!title || !description) {
      return res.status(400).json({
        message: "All fields required.",
      });
    }
    if(!category){
      return res.status(400).json({
        message:'atleast one category required'
      })
    }

    let imageUrl;
    try {
      imageUrl = await uploadCloudinary(filePath);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file: ${err}`);
        } else {
          console.log('File deleted successfully');
        }
      });
    } catch (error) {
      console.error(`Error uploading file to Cloudinary: ${error}`);
      imageUrl = 'https://cms.alhudood.net/assets/images/default-thumbnail.jpg';
    }

    const categories = category.map((cat) => JSON.parse(cat));
    
    const postEntry = await post.create({
      title,
      description,
      image: imageUrl,
      category: categories,
      userId,
      author,
    });

    if (postEntry) {
      return res.status(200).json({
        message: "Post entry successful.",
        data: postEntry,
      });
    } else {
      return res.status(400).json({
        message: "Failed to create post entry.",
      });
    }

  } catch (error) {
    console.error(`Error creating post: ${error}`);
    return res.status(400).json({
      message: "Blog Not Created, please enter all fields",
      error,
    });
  }
};
//update post
exports.updatePost = async (req, res) => {
  try {
     const { id } = req.params;
     const { title, description, category, userId, author, image } = req.body;
    
     const categories = category.map((category) => JSON.parse(category));
     const path = req.file?.path;

     let imageUrl;

     if (path) {
        // If path is available, upload to Cloudinary and use the new URL
        imageUrl = await uploadCloudinary(path).catch((error) => {
           console.error("Error uploading image to Cloudinary:", error);
           return null; // Return a default value or handle the error accordingly
          });
        
        //for deleting file form server
        if (imageUrl){
           
         fs.unlink(path, (err) => {
          if (err) {
           console.error(`Error deleting file: ${err}`);
         } else {
          console.log('File deleted successfully');
         }
        });
        }
     } else {
        // If path is not available, use the existing image URL
        imageUrl = image;
     }

     const payload = {
        title,
        description,
        image: imageUrl,
        category: categories ,
        userId,
        author,
     };

     const updateEntry = await post.findOneAndUpdate({ _id: id }, payload, {
     });

     if (updateEntry) {
        return res.status(200).json({
           message: "Post updated",
           updateEntry,
        });
     } else {
        return res.status(404).json({
           message: "Post not found",
        });
     }
  } catch (error) {
     console.error("Error updating post:", error);
     return res.status(500).json({
        message: "Internal Server Error",
     });
  }
};


//delete post
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const deletePost = await post.findByIdAndDelete(id);
    if (deletePost) {
      return res.status(200).json({
        message: "post deleted",
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: "post not deleted",
    });
  }
};
