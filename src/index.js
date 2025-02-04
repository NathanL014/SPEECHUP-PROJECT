const express = require("express") //import ExpressJS
const path = require("path") //import PathJS -> for the utilities for working with files and directory paths
const hbs = require("hbs") //import HandlebarsJS
const collection = require("./mongodb")
const session = require("express-session");
const bcrypt = require("bcrypt");
const multer = require("multer");
const router = express.Router();
const app = express() //starting ExpressJS

const templatePath = path.join(__dirname, "../templates") //preparing our templatePath to replace the views path

// Set storage engine for Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    },
});

// File upload filter (allow only images)
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);

        if (extName && mimeType) {
            return cb(null, true);
        } else {
            cb("Error: Only images are allowed!");
        }
    }
});

app.use(express.json()) //get the hbs files and get mongodb successfully connected

app.use("/uploads", express.static("uploads"));

app.set("view engine", "hbs")
app.set("views", templatePath)
app.use(express.urlencoded({extended:false}))

app.use(session({
    secret: "speechup_secret", // Change this to a secure random string
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));


app.get("/", (req, res) => {
    res.render("index")
})

app.get("/therapistlogin", (req, res) => {
    res.render("therapistlogin")
})

app.get("/therapistsignup", (req, res) => {
    res.render("therapistsignup")
})

app.get("/patientlogin", (req, res) => {
    res.render("patientlogin")
})

app.get("/patientsignup", (req, res) => {
    res.render("patientsignup")
})

app.get("/therapists", (req, res) => {
    res.render("therapists")
})

app.get("/patients", (req, res) => {
    res.render("patients")
})

app.get("/courses", (req, res) => {
    res.render("courses")
})

app.get("/apraxiagameselection", (req, res) => {
    res.render("apraxiagameselection")
})

app.get("/dysarthriagameselection", (req, res) => {
    res.render("dysarthriagameselection")
})

app.get("/aphasiagameselection", (req, res) => {
    res.render("aphasiagameselection")
})

app.get("/animalsounds", (req, res) => {
    res.render("animalsounds")
})

app.get("/bookreading", (req, res) => {
    res.render("bookreading")
})

app.get("/wordsearch", (req, res) => {
    res.render("wordsearch")
})

app.get("/wordflipbook", (req, res) => {
    res.render("wordflipbook")
})

app.get("/matchinggames", (req, res) => {
    res.render("matchinggames")
})

app.get("/tonguetwisters", (req, res) => {
    res.render("tonguetwisters")
})

app.get("/communityforum", (req, res) => {
    res.render("communityforum")
})

app.get("/content/therapistprofile", async (req, res) => {

    if (!req.session.user) {
        return res.redirect("/therapistlogin");
    }

        const user = await collection.therapistUsersCollection.findOne({ email: req.session.user.email });

        res.render("therapistprofile", { 
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profileImage: user.profileImage || "/uploads/default-profile.png"
        });
});

app.get("/content/patientprofile", async (req, res) => {

    if (!req.session.user) {
        return res.redirect("/patientlogin");
    }

    try {
        const user = await collection.patientUsersCollection.findOne({ email: req.session.user.email });

        if (!user) {
            return res.redirect("/patientlogin");
        }

        res.render("patientprofile", { 
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        });

    } catch (error) {
        console.error("Error fetching patient profile:", error);
        res.status(500).send("An error occurred.");
    }
});


app.get("/therapisthome", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/therapistlogin");
    }
    res.render("therapisthome", {
        firstName: req.session.user.firstName,
        profileImageTherapist: req.session.user.profileImageTherapist || "/default-profile.png"
    });
});

app.get("/patienthome", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/patientlogin");
    }
    res.render("patienthome", {
        firstName: req.session.user.firstName,
        profileImagePatient: req.session.user.profileImagePatient || "/default-profile.png"
    });
});

app.post("/therapistlogin", async (req, res) => {
    try {
        const check = await collection.therapistUsersCollection.findOne({ email: req.body.email });

        if (!check) {
            return res.render("therapistlogin", { error: "Invalid email or password." });
        }

        // Compare hashed password
        const passwordMatch = await bcrypt.compare(req.body.password, check.password);

        if (!passwordMatch) {
            return res.render("therapistlogin", { error: "Invalid email or password." });
        }

        // Store session data
        req.session.user = {
            firstName: check.firstName,
            lastName: check.lastName,
            email: check.email,
            profileImageTherapist: check.profileImageTherapist || "/uploads/default-profile.png"
        };

        console.log("Stored in Session:", req.session.user);
        res.redirect("/therapisthome");

    } catch (error) {
        console.error("Login Error:", error);
        return res.render("therapistlogin", { error: "An error occurred. Please try again." });
    }
});

app.post("/therapistsignup", async (req, res) => {

    try {
        // Hash password before storing
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        var newUser = {

            firstName : req.body.firstName,
            lastName : req.body.lastName,    
            email : req.body.email,
            password : hashedPassword

        }; 

        await collection.therapistUsersCollection.insertMany([newUser]);

        console.log("User registered successfully:", newUser);
        res.redirect("/therapistlogin"); // Redirect to login instead of homepage

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).send("An error occurred during signup.");
    }
});

app.post("/patientlogin", async (req, res) => {
    try {
        const check = await collection.patientUsersCollection.findOne({ email: req.body.email });

        if (!check) {
            console.log("No patient found with email:", req.body.email);
            return res.render("patientlogin", { error: "Invalid email or password." });
        }

        const passwordMatch = await bcrypt.compare(req.body.password, check.password);

        if (!passwordMatch) {
            console.log("Incorrect password for patient:", req.body.email);
            return res.render("patientlogin", { error: "Invalid email or password." });
        }

        req.session.user = {
            firstName: check.firstName,
            lastName: check.lastName,
            email: check.email,
            profileImage: check.profileImage || "/uploads/default-profile.png"
        };

        console.log("Stored in Session:", req.session.user);
        res.redirect("/patienthome");

    } catch (error) {
        console.error("Login Error:", error);
        return res.render("patientlogin", { error: "An error occurred. Please try again." });
    }
});

app.post("/patientsignup", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        var newUser = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hashedPassword
        };

        await collection.patientUsersCollection.insertMany([newUser]);

        console.log("Patient registered successfully:", newUser);
        res.redirect("/patientlogin");

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).send("An error occurred during signup.");
    }
});

app.post("/update-profile-therapist", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        let updatedFields = {
            firstName: req.body.firstName,
            lastName: req.body.lastName
        };

        if (req.body.password) {
            updatedFields.password = await bcrypt.hash(req.body.password, 10);
        }

        await collection.therapistUsersCollection.updateOne(
            { email: req.session.user.email },
            { $set: updatedFields }
        );

        req.session.user.firstName = req.body.firstName;
        req.session.user.lastName = req.body.lastName;

        res.json({ success: true });

    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post("/delete-account-therapist", async (req, res) => {
    await collection.therapistUsersCollection.deleteOne({ email: req.session.user.email });
    req.session.destroy(() => res.json({ success: true }));
});

app.post("/update-profile-patient", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        let updatedFields = {
            firstName: req.body.firstName,
            lastName: req.body.lastName
        };

        if (req.body.password) {
            updatedFields.password = await bcrypt.hash(req.body.password, 10);
        }

        await collection.patientUsersCollection.updateOne(
            { email: req.session.user.email },
            { $set: updatedFields }
        );

        req.session.user.firstName = req.body.firstName;
        req.session.user.lastName = req.body.lastName;

        res.json({ success: true });

    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post("/delete-account-patient", async (req, res) => {
    await collection.patientUsersCollection.deleteOne({ email: req.session.user.email });
    req.session.destroy(() => res.json({ success: true }));
});

app.post("/verify-password-therapist", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        // Fetch the user's hashed password from the database
        const user = await collection.therapistUsersCollection.findOne({ email: req.session.user.email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Compare entered password with hashed password
        const passwordMatch = await bcrypt.compare(req.body.password, user.password);

        if (passwordMatch) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Incorrect password" });
        }
    } catch (error) {
        console.error("Password verification error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post("/verify-password-patient", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        // Fetch the patient's hashed password from the database
        const user = await collection.patientUsersCollection.findOne({ email: req.session.user.email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Compare entered password with hashed password
        const passwordMatch = await bcrypt.compare(req.body.password, user.password);

        if (passwordMatch) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Incorrect password" });
        }
    } catch (error) {
        console.error("Password verification error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Upload profile picture route
app.post("/upload-therapist-profile", upload.single("profileImageTherapist"), async (req, res) => {

    try {

    if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized - No session user found" });
    }

    console.log("File received:", req.file); // Debugging: Check if file is received

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        const updatedProfileImageTherapist = "/uploads/" + req.file.filename;

        const user = await collection.therapistUsersCollection.findOneAndUpdate(
            { email: req.session.user.email },
            { $set: { profileImageTherapist: updatedProfileImageTherapist } },
            { new: true }
        );

        if (!user) return res.status(404).json({ error: "User not found" });

        req.session.user.profileImageTherapist = updatedProfileImageTherapist;

        console.log("Profile Image Updated:", updatedProfileImageTherapist);
        res.json({ success: true, profileImageTherapist: updatedProfileImageTherapist });
    } catch (err) {
        console.error("Error uploading profile image:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Upload profile picture route
app.post("/upload-patient-profile", upload.single("profileImagePatient"), async (req, res) => {

    try {

    if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized - No session user found" });
    }

    console.log("File received:", req.file); // Debugging: Check if file is received

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        const updatedProfileImage = "/uploads/" + req.file.filename;

        const user = await collection.patientUsersCollection.findOneAndUpdate(
            { email: req.session.user.email },
            { $set: { profileImage: updatedProfileImage } },
            { new: true }
        );

        if (!user) return res.status(404).json({ error: "User not found" });

        req.session.user.profileImage = updatedProfileImage;

        console.log("Profile Image Updated:", updatedProfileImage);
        res.json({ success: true, profileImage: updatedProfileImage });
    } catch (err) {
        console.error("Error uploading profile image:", err);
        res.status(500).json({ error: "Server error" });
    }
});


router.get("/therapisthome", (req, res) => {
    res.render("therapisthome", { firstName: req.user.firstName });
});

router.get("/patienthome", (req, res) => {
    res.render("patienthome", { firstName: req.user.firstName });
});

app.get('/content/:page', (req, res) => {
    const page = req.params.page;
    res.render(page);  // This will render therapists.hbs, patients.hbs, or courses.hbs
});

// Allowed pages
const allowedPages = ["home", "therapists", "patients", "courses", "communityforum", "patientprofile"];
const allowedGamePages = ["apraxiagameselection", "dysarthriagameselection", "aphasiagameselection"];

// Route to fetch dynamic content
router.get("/:page", (req, res) => {
    const page = req.params.page;
    
    if (!allowedPages.includes(page)) {
        return res.status(404).send("Page not found");
    }
    
    // Check if the requested page exists
    res.render(page, (err, html) => {
        if (err) {
            console.error(`Error rendering page: ${page}`, err);
            return res.status(404).send("Page not found");
        }
        res.send(html);
    });
});

module.exports = router;

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

app.listen(3000, () => {
    console.log("Listening to Port 3000")
})

   