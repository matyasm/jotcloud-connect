
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const LoginHeader = () => {
  return (
    <header className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center">
          <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Back to home</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default LoginHeader;
