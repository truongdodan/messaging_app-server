const supabase = require("../lib/supabase");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async uploadFile(file) {
    // create unique file name
    // keep file extension
    const ext = path.extname(file.originalname);
    const uniqueFileName = `${uuidv4()}${ext}`;

    const { data, error } = await supabase.storage
      .from("chat-files")
      .upload(uniqueFileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw new Error(error.message);

    return data;
  },
  async uploadPublicFile(file) {
    // create unique file name
    // keep file extension
    const ext = path.extname(file.originalname);
    const uniqueFileName = `${uuidv4()}${ext}`;

    const { data, error } = await supabase.storage
      .from("chat-files")
      .upload(uniqueFileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw new Error(error.message);

    return data;
  },
  async deleteFile(path) {
    const { data, error } = await supabase.storage
      .from("chat-files")
      .remove([path]);

    if (error) throw new Error(error.message);

    return data;
  },
  async getSignUrl(path) {
    const { data, error } = await supabase.storage
      .from("chat-files")
      .createSignedUrl(path, 3600); // Expires in 1 hour

    if (error) throw new Error(error.message);

    return data;
  },
};
