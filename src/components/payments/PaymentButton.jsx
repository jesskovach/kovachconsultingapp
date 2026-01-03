import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PaymentButton({ clientId, amount, description, type = "session", sessionId, size = "default", variant = "default", children }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      console.log('=== PAYMENT BUTTON CLICKED ===');
      console.log('Payment params:', { clientId, amount, description, type, sessionId });
      
      setLoading(true);
      alert('Starting payment request...');
      
      const response = await base44.functions.invoke('createStripeCheckout', {
        clientId,
        amount,
        description,
        type,
        sessionId
      });

      alert(`Response received! Status: ${response.status}`);
      console.log('=== FULL RESPONSE ===');
      console.log('Response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Response data keys:', response.data ? Object.keys(response.data) : 'null');
      console.log('Response URL:', response.data?.url);

      if (response.data?.url) {
        console.log('✅ URL found, redirecting to:', response.data.url);
        alert(`Redirecting to Stripe: ${response.data.url}`);
        window.location.href = response.data.url;
      } else if (response.data?.error) {
        console.error('❌ Error in response:', response.data.error);
        alert(`Payment Error: ${response.data.error}`);
        toast.error(response.data.error);
      } else {
        console.error('⚠️ Unexpected response format');
        console.log('Full response object:', JSON.stringify(response, null, 2));
        alert(`No URL in response. Full response: ${JSON.stringify(response.data)}`);
        toast.error('Failed to create checkout session - check console');
      }
    } catch (error) {
      console.error('=== PAYMENT ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      alert(`Payment Error: ${error.message || JSON.stringify(error)}`);
      toast.error(error.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
      console.log('=== PAYMENT PROCESS COMPLETE ===');
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      size={size}
      variant={variant}
      className={variant === "outline" ? "" : "bg-slate-800 hover:bg-slate-700"}
    >
      {children || (
        <>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4 mr-2" />
          )}
          Pay ${amount}
        </>
      )}
    </Button>
  );
}