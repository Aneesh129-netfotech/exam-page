import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ActivityMonitor from "../components/ActivityMonitor";
import FaceDetection from "../components/FaceDetection";
import MonacoEditor from "@monaco-editor/react";

const ExamPage = () => {
  const [answers, setAnswers] = useState({});
  const [questions, setQuestions] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { testId } = useParams();
  const navigate = useNavigate();

  // Fetch questions from backend
  useEffect(() => {
    if (testId) {
      axios
        .get(`http://localhost:5000/api/test/${testId}`)
        .then((res) => setQuestions(res.data.questions))
        .catch((err) => console.error("Failed to fetch questions", err));
    }
  }, [testId]);

  // Handle answer change
  const handleAnswerChange = (index, value) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  // Submit exam
  const handleSubmit = async () => {
    setSubmitting(true);
    const payload = {
      question_set_id: testId,
      questions: questions.map((q, index) => ({
        question: q.question,
        ...(q.question_type === "mcq" && { options: q.options }),
        answer: answers[index] || "",
      })),
      answers: questions.map((_, index) => answers[index] || ""),
      languages: questions.map((q, index) =>
        q.question_type === "code" ? selectedLanguages[index] || "javascript" : null
      ),
      duration_used: 0,
    };

    try {
      const res = await axios.post("http://localhost:5000/api/test/submit", payload);
      navigate("/test_result", { state: { result: res.data } });
    } catch (err) {
      console.error("Submission failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-100 text-gray-900 min-h-screen p-4">
      {/* Hidden proctoring components */}
      <FaceDetection />
      <ActivityMonitor />

      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6 text-center">Online Assessment</h2>

        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={index} className="p-4 border border-gray-300 rounded-md">
              <p className="mb-2 font-medium">{index + 1}. {q.question}</p>

              {/* MCQ question */}
              {q.question_type === "mcq" && q.options && (
                <div className="flex flex-col space-y-2">
                  {q.options.map((opt, idx) => {
                    const optionText = typeof opt === "string" ? opt : opt.text;
                    return (
                      <label
                        key={idx}
                        className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer
                          ${answers[index] === optionText ? "bg-blue-100" : "hover:bg-gray-100"}`}
                      >
                        <input
                          type="radio"
                          name={`q${index}`}
                          value={optionText}
                          checked={answers[index] === optionText}
                          onChange={(e) => handleAnswerChange(index, e.target.value)}
                          className="accent-blue-500"
                        />
                        <span className="font-semibold">{String.fromCharCode(65 + idx)})</span>
                        <span>{optionText}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Code question */}
              {q.question_type === "code" && (
                <div className="flex flex-col space-y-2">
                  <select
                    value={selectedLanguages[index] || "javascript"}
                    onChange={(e) =>
                      setSelectedLanguages((prev) => ({ ...prev, [index]: e.target.value }))
                    }
                    className="w-40 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                  </select>
                  <MonacoEditor
                    height="400px"
                    language={selectedLanguages[index] || "javascript"}
                    theme="vs-light"
                    value={answers[index] || ""}
                    onChange={(value) => handleAnswerChange(index, value)}
                    options={{ minimap: { enabled: false }, fontSize: 14 }}
                  />
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-center mt-6">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-6 py-3 rounded-md text-white font-semibold transition
                ${submitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {submitting ? "Submitting..." : "Submit Exam"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;
