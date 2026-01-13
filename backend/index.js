import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './src/routes/authRoute.js';
import { userRouter } from './src/routes/userRoute.js';
import { supportRouter } from './src/routes/supportRoute.js';
import { subscriptionRouter } from './src/routes/subscriptionRoute.js';
import { activityLogRouter } from './src/routes/activityLogRoute.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter);
app.use('/users', userRouter);
app.use('/tickets', supportRouter);
app.use('/subscriptions', subscriptionRouter);
app.use('/activity', activityLogRouter);

// export default app;

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});