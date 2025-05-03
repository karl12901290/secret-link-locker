
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { motion } from "@/components/ui/motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6 max-w-md mx-auto"
      >
        <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-inner">
          <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-300 dark:to-gray-500">
            404
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="pt-4">
          <Button 
            asChild
            className="group transition-all duration-300"
          >
            <a href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>Return Home</span>
            </a>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
