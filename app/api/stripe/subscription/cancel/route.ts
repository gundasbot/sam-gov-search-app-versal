// app/api/stripe/subscription/cancel/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

export async function POST(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the subscription ID from the request body
    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    console.log(`ðŸ”„ Canceling subscription: ${subscriptionId}`);

    // Cancel the subscription at period end
    const canceledSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    console.log(`âœ… Subscription marked for cancellation at period end`);

    // Extract currentPeriodEnd safely
    const periodEnd = (canceledSubscription as any).currentPeriodEnd;
    const current_period_end = typeof periodEnd === 'number' 
      ? new Date(periodEnd * 1000).toISOString()
      : null;

    return NextResponse.json({
      success: true,
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        cancel_at_period_end: canceledSubscription.cancel_at_period_end,
        currentPeriodEnd: current_period_end,
      },
    });

  } catch (error: any) {
    console.error('âŒ Error canceling subscription:', error);
    
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to cancel subscription',
        details: error?.type || 'unknown_error'
      },
      { status: 500 }
    );
  }
}

// Optional: Add a DELETE method for immediate cancellation
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    console.log(`ðŸ”„ Immediately canceling subscription: ${subscriptionId}`);

    // Cancel the subscription immediately
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);

    console.log(`âœ… Subscription canceled immediately`);

    return NextResponse.json({
      success: true,
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        canceledAt: canceledSubscription.canceled_at,
      },
    });

  } catch (error: any) {
    console.error('âŒ Error canceling subscription:', error);
    
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to cancel subscription',
        details: error?.type || 'unknown_error'
      },
      { status: 500 }
    );
  }
}
