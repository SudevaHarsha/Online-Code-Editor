// backend/controllers/authController.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";

// Registration
export const register = async (req, res) => {
  try {
    const { email, password, firebaseUserId } = req.body;
    const user = new User({ email, password, firebaseUserId });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password, firebaseUserId, imageUrl, name } = req.body;
    const user = await User.findOne({ email, firebaseUserId });
    if (!user) {
      const user = new User({ name, email, password, firebaseUserId, imageUrl });
      await user.save();
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      user.token = token;
      await user.save();
      console.log(user);
      return res.json(user);
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    user.token = token; // Update the user's token field
    await user.save(); // Save the user with the new token
    console.log(user);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(error);
  }
};

/*  const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send('Unauthorized');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.decode(token, null, true);
        const clerkId = decoded.sub;

        let user = await User.findOne({ clerkId });

        if (!user) {
            // User not found, create a new user
            const { username, email } = req.body; // Expect username and email in the request body
            user = new User({ clerkId, username, email });
            await user.save();
        }

        res.json(user); // Send user data back to the frontend
    } catch (error) {
        res.status(401).send('Invalid token or registration failed');
    }
}; */

/* router.post('/auth', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send('Unauthorized');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.decode(token, null, true);
        const clerkId = decoded.sub;

        let user = await User.findOne({ clerkId });

        if (!user) {
            // User not found, create a new user
            const { username, email } = req.body; // Expect username and email in the request body
            user = new User({ clerkId, username, email });
            await user.save();
        }

        res.json(user); // Send user data back to the frontend
    } catch (error) {
        res.status(401).send('Invalid token or registration failed');
    }
});

module.exports = router; */
