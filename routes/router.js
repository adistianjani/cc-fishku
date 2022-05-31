const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { registerValidation, loginValidation } = require("../middleware/auth-validation");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var http = require("http");

router.get("/test", function(req, res) {
    res.write("tes aja uhuy");
});

// REGISTER AKUN FISHKU
router.post("/register", registerValidation, (req, res, next) => {
    db.query(`SELECT * FROM consumer WHERE LOWER(email) = LOWER(${db.escape(req.body.email)});`, (err, result) => {
        if (result.length) {
            return res.status(409).send({
                msg: "Akun ini sudah ada!",
            });
        } else {
            // email tersedia
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if (err) {
                    return res.status(500).send({
                        msg: err,
                    });
                } else {
                    // sudah meng-hash password => tambah ke database
                    db.query(`INSERT INTO consumer (name, email, password, phone_number, address) VALUES ('${req.body.name}', ${db.escape(req.body.email)}, ${db.escape(hash)}, '${req.body.phone_number}', '${req.body.address}')`, (err, result) => {
                        if (err) {
                            throw err;
                            return res.status(400).send({
                                msg: err,
                            });
                        }
                        return res.status(201).send({
                            msg: "Akun sudah terdaftar.",
                        });
                    });
                }
            });
        }
    });
});

// LOGIN AKUN FISHKU
router.post("/login", loginValidation, (req, res, next) => {
    db.query(`SELECT * FROM consumer WHERE email = ${db.escape(req.body.email)};`, (err, result) => {
        // akun tidak ditemukan
        if (err) {
            throw err;
            return res.status(400).send({
                msg: err,
            });
        }
        if (!result.length) {
            return res.status(401).send({
                msg: "Email atau password salah",
            });
        }
        // cek password
        bcrypt.compare(req.body.password, result[0]["password"], (bErr, bResult) => {
            // password salah
            if (bErr) {
                throw bErr;
                return res.status(401).send({
                    msg: "Email atau password salah",
                });
            }
            if (bResult) {
                const token = jwt.sign({ id: result[0].id }, "the-super-strong-secrect");

                return res.status(200).send({
                    msg: "Logged in.",
                    token,
                    user: result[0],
                });
            }
            return res.status(401).send({
                msg: "Email atau password salah",
            });
        });
    });
});

// MENDAPATKAN DATA CONSUMER DARI DATABASE YG SUDAH TERDAFTAR
router.get("/consumer/:email", registerValidation, (req, res, next) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer") || !req.headers.authorization.split(" ")[1]) {
        return res.status(422).json({
            message: "Sediakan token dari akun yang login",
        });
    }
    const theToken = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(theToken, "the-super-strong-secrect");
    db.query("SELECT * FROM consumer where email = ?", decoded.id, function(err, results, fields) {
        if (err) throw err;
        return res.send({ error: false, data: results[0], message: "Data consumer berhasil didapat." }).write("berhasil masup").redirect("/dashboard");
    });
});

// DASHBOARD (masih bingung cara tampilin dashboard dari akun yg udah di login)
router.get("/dashboard", (req, res) => {

    const consumer_name = "SELECT * FROM consumer WHERE name = ?";
    const consumer_address = "SELECT * FROM consumer WHERE address = ?";
    db.query(consumer_name, consumer_address, (err, result) => {
        if (err) throw err;
        return res.send({ data: result, message: "Nama dan alamat ditampilkan" }).get("/consumer/:email")
    })

    // const token = jwt.sign({ id: result[0].id }, "the-super-strong-secrect"); ?????????

})

// LIST IKAN DI 1 LOKASI
router.get("/fish_caught", (req, res) => {
    const fish = "SELECT * FROM fish_caught"
    db.query(fish, (err, result) => {
        if (err) throw err;
        return res.send(result)
    })
})

// CARI 1 IKAN BERDASARKAN NAMA
router.get("/fish_caught/fish_name?search=:fish_name", (req, res) => {
    const fishName = `SELECT * FROM fish_caught WHERE fish_name = ${fish_name}`
    db.query(fishName, (err, result) => {
        if (err) throw err;
        return res.send(result).get("SELECT * FROM fish_caught WHERE fish_name = ?")
    })
})

// DETAIL IKAN
// router.get("/fish_caught/:fish_name/detail_fish", (req, res) => {

// })


module.exports = router;
