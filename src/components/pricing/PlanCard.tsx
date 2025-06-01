
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, Bitcoin, Upload } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Plan = Tables<"plans">;

interface PlanCardProps {
  plan: Plan;
  currentPlan: string | null;
  loading: boolean;
  onSelectPlan: (planName: string, planId: string, isFree: boolean) => void;
}

export const PlanCard = ({ plan, currentPlan, loading, onSelectPlan }: PlanCardProps) => {
  const renderFeatures = (featuresArray: any[]) => {
    return (
      <ul className="space-y-2">
        {featuresArray.map((feature, index) => (
          <li key={index} className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    );
  };

  const highlightExplorerLimit = (plan: Plan) => {
    if (plan.name === "Explorer" || plan.price === 0) {
      return (
        <div className="flex items-center">
          <Shield className="h-4 w-4 text-primary mr-2" />
          <span className="font-medium">Up to 5 links</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center">
        <Shield className="h-4 w-4 text-primary mr-2" />
        <span>
          {plan.links_limit === -1
            ? "Unlimited links"
            : `${plan.links_limit} links`}
        </span>
      </div>
    );
  };

  const renderFileUploadFeature = (plan: Plan) => {
    const hasFileUpload = plan.name !== "Explorer" && plan.price > 0;
    
    return (
      <div className="flex items-center">
        <Upload className="h-4 w-4 mr-2" style={{ color: hasFileUpload ? '#22c55e' : '#9ca3af' }} />
        <span className={hasFileUpload ? '' : 'text-gray-400 line-through'}>
          File uploads
        </span>
      </div>
    );
  };

  return (
    <Card 
      className={`flex flex-col ${
        plan.name === "Power" 
          ? "border-primary ring-2 ring-primary ring-opacity-50" 
          : plan.name === "Explorer"
          ? "border-amber-200" 
          : ""
      }`}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{plan.name}</CardTitle>
          {plan.name === "Power" && (
            <Badge variant="secondary" className="ml-2">
              Popular
            </Badge>
          )}
          {plan.name === "Explorer" && (
            <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
              Free
            </Badge>
          )}
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-6">
          <span className="text-3xl font-bold">${plan.price}</span>
          <span className="text-sm text-gray-600">/month</span>
        </div>
        
        <div className="space-y-4">
          {highlightExplorerLimit(plan)}
          
          <div className="flex items-center">
            <Shield className="h-4 w-4 text-primary mr-2" />
            <span>
              {plan.max_expiration_days === 1
                ? "24 hour expiry"
                : `${plan.max_expiration_days} day max expiry`}
            </span>
          </div>
          
          {renderFileUploadFeature(plan)}
          
          {plan.features && Array.isArray(plan.features) && renderFeatures(plan.features as string[])}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => onSelectPlan(plan.name, plan.id, plan.price === 0)}
          disabled={loading || currentPlan === plan.name}
          className="w-full"
          variant={plan.name === "Power" ? "default" : plan.name === "Explorer" ? "secondary" : "outline"}
        >
          {currentPlan === plan.name
            ? "Current Plan"
            : loading
            ? "Processing..."
            : plan.price === 0 
            ? "Select Free Plan"
            : <>
                <Bitcoin className="h-4 w-4 mr-2" /> 
                Pay with Crypto
              </>}
        </Button>
      </CardFooter>
    </Card>
  );
};
