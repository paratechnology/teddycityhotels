import multer from 'multer';
// import  path from 'path';
const multerStorage = multer.memoryStorage();


// export function checkFileType(file:any, cb:any) {
//   // Allowed ext
//   const filetypes = /pdf|doc|docx|xls|xlsx|jpg|jpeg|png/;
//   // Check ext
//   const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//   // Check mime
//   const mimetype = filetypes.test(file.mimetype);

//   if (mimetype && extname) {
//     return cb(null, true);
//   } else {
//     cb('Error: Images and Documents Only!');
//   }
// }



const upload = multer({
     storage: multerStorage, 
     limits:{
        fieldSize: 10 * 1024 * 1024, 
     }   
    }); // Configure upload destination

export const uploadImageMiddleware = upload.single('image');





const uploadDocs = multer({
     storage: multerStorage, 
     limits:{
        fieldSize: 10 * 1024 * 1024, 
     },    
   }); 

   export const uploadDocsMiddleware = uploadDocs.single('file');




