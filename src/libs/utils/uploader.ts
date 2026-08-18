import path from "path";
import fs from "fs";
import multer from "multer";
import { randomUUID } from "crypto";

/* MULTER IMAGE UPLOADER */
function getTargetImageStore(address: any) {
    const uploadPath = `./uploads/${address}`;
    return multer.diskStorage({
        destination: function (req, file, cb) {
            fs.mkdirSync(uploadPath, { recursive: true }); // creates the folder() only if missing;
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        console.log(file);
        const extension = path.parse(file.originalname).ext;
        const random_name = randomUUID() + extension;
        cb(null, random_name);
    }
    });
}


const makeUploader = (address: string) => {
    const storage = getTargetImageStore(address);
    return multer({storage: storage});
};

export default makeUploader;