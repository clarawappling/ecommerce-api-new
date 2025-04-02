import { Request, Response } from "express";
import { db } from "../config/db";
import { STRIPE_SECRET_KEY } from "../constants/env";
import { IStripeOrder } from "../models/IStripeOrder";
import { ResultSetHeader } from "mysql2";
const stripe = require('stripe')(STRIPE_SECRET_KEY);

export const checkoutSessionEmbedded = async (req: Request, res: Response) => {
    const {order_id, order_items}: IStripeOrder = req.body;
  const session = await stripe.checkout.sessions.create({
    line_items: 
    order_items.map((item) => {
      return (
        {
          price_data: {
            currency: 'sek',
            product_data: {
              name: item.product_name,
            },
            unit_amount: item.unit_price * 100,
          },
          quantity: item.quantity 
        }
      )
    }),
    mode: 'payment',
    ui_mode: 'embedded',
    return_url: 'http://localhost:5173/order-confirmation?session_id={CHECKOUT_SESSION_ID}',
    client_reference_id: order_id
  });
  res.send({clientSecret: session.client_secret});
};

export const webhook = async (req: Request, res: Response) => {
    const event = req.body;

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log(session)
  
        const sql = `
        UPDATE orders
        SET payment_status = ?, payment_id = ?, order_status = ?
        WHERE id = ?
        `;
        
        const params = [session.payment_status, session.id, session.status, session.client_reference_id]
        await db.query<ResultSetHeader>(sql, params);
  
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {   
    expand: ['line_items'], 
      });
  
      const lineItems = fullSession.line_items.data || [];
  
      for (const item of lineItems) {
        const productName = item.description;
        const quantityOrdered = item.quantity;
  
        const updateStockSQL = `
        UPDATE products
        SET stock = stock - ?
        WHERE name = ?
        `;
        const updateParams = [quantityOrdered, productName];
        await db.query<ResultSetHeader>(updateStockSQL, updateParams);
      }
        default: console.log("This event type is not handled")
    }
    res.json({received: true});
};
