import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PaymentButton({ 
  amount, 
  description, 
  clientId, 
  clientName, 
  type = "session",
  sessionId,
  variant = "default",
  size = "default",
  className = ""
}) {
  const createCheckoutMutation = useMutation({
    mutationFn: async () => {
      const { data } = await base44.functions.invoke('createStripeCheckout', {
        amount,
        description,
        clientId,
        clientName,
        type,
        sessionId
      });
      return data;
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      toast.error("Failed to create payment: " + error.message);
    }
  });

  const handlePayment = () => {
    createCheckoutMutation.mutate();
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePayment}
      disabled={createCheckoutMutation.isPending}
      className={className}
    >
      {createCheckoutMutation.isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4 mr-2" />
      )}
      Pay ${amount}
    </Button>
  );
}