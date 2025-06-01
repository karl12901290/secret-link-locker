
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface TopUpSectionProps {
  loading: boolean;
  isAuthenticated: boolean;
  onTopUp: (amount: number, credits: number) => void;
}

export const TopUpSection = ({ loading, isAuthenticated, onTopUp }: TopUpSectionProps) => {
  return (
    <div className="mt-12 text-center">
      <h2 className="text-2xl font-bold mb-4">Need More?</h2>
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-center mb-4">
          <Zap className="h-6 w-6 text-primary mr-2" />
          <span className="text-lg font-medium">Top-Up Credits</span>
        </div>
        <p className="mb-4 text-gray-600">
          Need more links but don't want to upgrade? Buy additional credits anytime.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <Button 
            variant="outline" 
            className="flex flex-col" 
            onClick={() => onTopUp(1, 20)}
            disabled={loading || !isAuthenticated}
          >
            <span className="text-lg font-bold">$1</span>
            <span className="text-xs">20 links</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex flex-col" 
            onClick={() => onTopUp(3, 70)}
            disabled={loading || !isAuthenticated}
          >
            <span className="text-lg font-bold">$3</span>
            <span className="text-xs">70 links</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex flex-col" 
            onClick={() => onTopUp(5, 120)}
            disabled={loading || !isAuthenticated}
          >
            <span className="text-lg font-bold">$5</span>
            <span className="text-xs">120 links</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
