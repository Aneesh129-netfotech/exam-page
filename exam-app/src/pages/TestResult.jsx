import React from 'react';
import { CheckCircle, XCircle, Award, BarChart3, Clock } from 'lucide-react';

const TestResult = ({ result, onNavigate }) => {
  // Extract values with defaults - calculate max score from result data
  const score = result?.score || 0;
  const rawFeedback = result?.raw_feedback || '';
  
  // Parse number of questions from feedback or use provided max_score
  const questionCount = result?.total_questions || 
    (rawFeedback.match(/Q\d+/g) || []).length ||
    (result?.max_score ? result.max_score / 10 : 0);
    
  const maxScore = result?.max_score || (questionCount * 10);
  const percentage = result?.percentage || (maxScore > 0 ? (score / maxScore) * 100 : 0);
  const status = result?.status || 'Fail';
  
  // Always use neutral colors instead of pass/fail colors
  const statusColor = 'blue';
  const bgGradient = 'bg-gradient-to-br from-blue-50 to-indigo-100';
  
  // Parse individual question scores from raw feedback for detailed breakdown
  const parseQuestionScores = (feedback) => {
    const questionPattern = /Q(\d+).*?Score:\s*(\d+)\/10/gi;
    const matches = [...feedback.matchAll(questionPattern)];
    return matches.map(match => ({
      question: parseInt(match[1]),
      score: parseInt(match[2]),
      maxScore: 10
    }));
  };

  const questionScores = parseQuestionScores(rawFeedback);

  return (
    <div className={`min-h-screen ${bgGradient} py-12 px-4`}>
      <div className="max-w-4xl mx-auto">
        {/* Main Result Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center mb-6">
          <div className={`bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <CheckCircle className={`w-8 h-8 text-blue-600`} />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Completed!</h1>
          <p className="text-gray-600 mb-6">Thank you for taking the test</p>

          {/* Score Display */}
          <div className={`bg-blue-50 rounded-lg p-6 mb-6`}>
            <div className="flex items-center justify-center mb-4">
              <Award className={`w-6 h-6 text-blue-600 mr-2`} />
              <p className={`text-2xl font-bold text-blue-600`}>Your Score</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-gray-900">{score}</p>
                <p className="text-sm text-gray-600">Points Scored</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{maxScore}</p>
                <p className="text-sm text-gray-600">Total Points</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{percentage.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Percentage</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold mb-6 bg-blue-100 text-blue-800">
            <Clock className="w-4 h-4 mr-2 text-blue-600" />
            We will contact you soon
          </div>
        </div>

        {/* Question Breakdown */}
        {questionScores.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Question Breakdown</h2>
            </div>
            
            <div className="grid gap-3">
              {questionScores.map(({ question, score, maxScore }) => (
                <div key={question} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Question {question}</span>
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-gray-900 mr-3">
                      {score}/{maxScore}
                    </span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          score === maxScore ? 'bg-green-500' : 
                          score >= maxScore * 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(score / maxScore) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Your Performance</h3>
              <p className="text-sm text-blue-700">
                {percentage >= 90 ? "Excellent work! You demonstrated strong understanding across all areas." :
                 percentage >= 70 ? "Good performance! You showed solid knowledge in most topics." :
                 percentage >= 50 ? "Fair performance. You have a good foundation to build upon." :
                 "Thank you for your effort. Every assessment is a learning opportunity."}
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Next Steps</h3>
              <p className="text-sm text-green-700">
                Our HR team will review your assessment results and reach out to you within 2-3 business days regarding the next stages of the application process.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <button
            onClick={() => onNavigate('generate')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200 mr-4"
          >
            Take Another Test
          </button>
          
          <button
            onClick={() => {
              const element = document.createElement('a');
              const file = new Blob([rawFeedback], { type: 'text/plain' });
              element.href = URL.createObjectURL(file);
              element.download = `test-feedback-${new Date().toISOString().split('T')[0]}.txt`;
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
          >
            Download Detailed Feedback
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestResult;