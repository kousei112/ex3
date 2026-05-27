require("dotenv").config({ quiet: true });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

mongoose
  .connect(
    "mongodb+srv://20235365:Long1208@cluster.lvx6afe.mongodb.net/it4409-db?appName=Cluster",
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Error:", err));

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên không được để trống"],
    minlength: [2, "Tên phải có ít nhất 2 ký tự"],
  },
  age: {
    type: Number,
    required: [true, "Tuổi không được để trống"],
    min: [0, "Tuổi phải >= 0"],
  },
  email: {
    type: String,
    required: [true, "Email không được để trống"],
    match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
    unique: true,
  },
  address: {
    type: String,
  },
});

const User = mongoose.model("User", UserSchema);

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

app.get("/api/users", async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 5;
    const search = req.query.search?.trim() || "";

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { address: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      page,
      limit,
      total,
      totalPages,
      data: users,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const age = req.body.age !== undefined ? parseInt(req.body.age) : undefined;
    const email = req.body.email?.trim().toLowerCase();
    const address = req.body.address?.trim() || undefined;

    const newUser = await User.create({ name, age, email, address });

    res.status(201).json({
      message: "Tạo người dùng thành công",
      data: newUser,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name.trim();
    if (req.body.age !== undefined) updateData.age = parseInt(req.body.age);
    if (req.body.email !== undefined)
      updateData.email = req.body.email.trim().toLowerCase();
    if (req.body.address !== undefined)
      updateData.address = req.body.address.trim();

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    res.json({
      message: "Cập nhật người dùng thành công",
      data: updatedUser,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    res.json({ message: "Xóa người dùng thành công" });
  } catch (err) {
    if (err.code === 11000) {
    return res.status(400).json({
      error: "Email đã được đăng ký rồi",
    });
  }
    res.status(400).json({ error: "Email da duoc dang ki" });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Server running on http://localhost:3001");
});
