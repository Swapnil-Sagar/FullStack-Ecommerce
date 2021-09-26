const express = require("express");
const env = require("dotenv");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const Razorpay = require("razorpay");
const stripe = require("stripe")(
  "sk_test_51JdVOTSA16K8YVWanMAPTP1FtWylMPB8oGYqhFNlDTPTwWd6PVYiw0BNIcqjB0TM74sidjs3WsvSJhqBz05EW3We00pY41YNow"
);
const uuid = require("uuid");

//routes
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin/auth");
const categoryRoutes = require("./routes/category");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const initialDataRoutes = require("./routes/admin/initialData");
const pageRoutes = require("./routes/admin/page");
const addressRoutes = require("./routes/address");
const orderRoutes = require("./routes/order");
// const payment = require("./routes/payment");
const adminOrderRoute = require("./routes/admin/order.routes");
//razorpay instance
const key_id = "rzp_test_PrXRgZCEH1H1gv";
const key_secret = "20nKl3ppS2M6baafmcP8BBUT";

const instance = new Razorpay({
  key_id,
  key_secret,
});

//environment variable or you can say constants
env.config();

//mongodb connection
//mongodb+srv://root:<password>@cluster0.okmsx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@cluster0.okmsx.mongodb.net/${process.env.MONGO_DB_DATABASE}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    }
  )
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log(Error, err.message);
  });

app.use(cors());
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "uploads")));
app.use("/api", authRoutes);
app.use("/api", adminRoutes);
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);
app.use("/api", cartRoutes);
app.use("/api", initialDataRoutes);
app.use("/api", pageRoutes);
app.use("/api", addressRoutes);
app.use("/api", orderRoutes);
app.use("/api", adminOrderRoute);

app.post("/api/payment", async (req, res) => {
  console.log("DAA Request:", req.body);

  let error;
  let status;
  try {
    const { totalAmount, product, token } = req.body;

    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id,
    });

    const idempotencyKey = uuid.v4();
    const charge = await stripe.charges.create(
      {
        amount: totalAmount * 100,
        currency: "inr",
        customer: customer.id,
        receipt_email: token.email,
        description: `Purchased`,
        shipping: {
          name: token.card.name,
          address: {
            line1: token.card.address_line1,
            line2: token.card.address_line2,
            city: token.card.address_city,
            country: token.card.address_country,
            postal_code: token.card.address_zip,
          },
        },
      },
      {
        idempotencyKey,
      }
    );
    console.log("Charge:", { charge });
    status = "success";
  } catch (error) {
    console.error("Error:", error);
    status = "failure";
  }

  res.json({ error, status });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
