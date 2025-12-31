'use client';

import { useState } from 'react';
import { OrderHistoryList, ReorderModal } from '@/components/account';

export default function OrderHistoryPage() {
  const [reorderModalOpen, setReorderModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleReorder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setReorderModalOpen(true);
  };

  const handleCloseModal = () => {
    setReorderModalOpen(false);
    setSelectedOrderId(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Order History</h1>
        <p className="text-muted-foreground">
          View and manage your past orders
        </p>
      </div>

      <OrderHistoryList onReorder={handleReorder} />

      {selectedOrderId && (
        <ReorderModal
          orderId={selectedOrderId}
          isOpen={reorderModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
