import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function POST(request) {
  try {
    const { courseId, userId, userEmail, price, title } = await request.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: title },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { courseId, userId },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/courses?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/courses?canceled=true`,
    })

    return Response.json({ url: session.url })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}