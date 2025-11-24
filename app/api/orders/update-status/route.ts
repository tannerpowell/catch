import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN, // Need write token
});

export async function POST(request: NextRequest) {
  try {
    const { orderId, newStatus } = await request.json();

    // Validate inputs
    if (!orderId || !newStatus) {
      return NextResponse.json(
        { error: 'Missing orderId or newStatus' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Build timestamp field based on status
    const timestampField = `${newStatus}At`;
    const timestamp = new Date().toISOString();

    // Update order in Sanity
    const updatedOrder = await sanityClient
      .patch(orderId)
      .set({
        status: newStatus,
        [timestampField]: timestamp,
      })
      .commit();

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
