
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bitcoin, ArrowLeft } from "lucide-react";

interface PricingHeaderProps {
  isAuthenticated: boolean;
  currentPlan: string | null;
}

export const PricingHeader = ({ isAuthenticated, currentPlan }: PricingHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="text-center mb-12">
      <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
      <p className="text-gray-600 max-w-xl mx-auto">
        Select the plan that fits your needs. Pay with cryptocurrency.
      </p>
      <div className="flex items-center justify-center mt-4">
        <Bitcoin className="h-5 w-5 text-orange-500 mr-2" />
        <span className="text-sm">We accept cryptocurrency payments via Coinbase Commerce</span>
      </div>
      
      {isAuthenticated && currentPlan && (
        <div className="mt-4 flex justify-center">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" /> 
            Back to Dashboard
          </Button>
        </div>
      )}
      
      {!isAuthenticated && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
          <p className="text-yellow-700">
            You need an account to subscribe to a plan. 
            <Button 
              variant="link" 
              className="text-primary" 
              onClick={() => navigate("/auth")}
            >
              Sign in or create an account
            </Button>
          </p>
        </div>
      )}
    </div>
  );
};
