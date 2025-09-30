import { Request, Response, Router } from 'express';
import { getSwapTransaction } from '../services/jupiter'; 

const swapRouter = Router();


swapRouter.post('/swap', async (req: Request, res: Response) => {
    try {
        const { route, userPublicKey } = req.body;

        if (!route || !userPublicKey) {
            return res.status(400).json({ error: "Missing route or userPublicKey." });
        }

        // Call the Jupiter service function to assemble the raw transaction
        const swapTransaction = await getSwapTransaction({
            route,
            userPublicKey,
            wrapUnwrapSOL: true, // Recommended for flexibility
        });

        // The response contains the serialized transaction which the frontend will sign
        return res.json(swapTransaction);

    } catch (error) {
        console.error("Error generating swap transaction:", error);
        return res.status(500).json({ error: "Failed to assemble swap transaction." });
    }
});

export default swapRouter;