import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ActivityMonitor from "../components/ActivityMonitor";
import FaceDetection from "../components/FaceDetection";
import MonacoEditor from "@monaco-editor/react";

// ---------- Toast System Inside ExamPage ----------
let nextToastId = 1;
const ICONS = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
};
const VARIANT_STYLES = {
  success: "bg-green-50 text-green-900 border-green-200",
  error: "bg-red-50 text-red-900 border-red-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  info: "bg-blue-50 text-blue-900 border-blue-200",
};

const ToastContainer = ({ toasts, remove }) => (
  <div className="fixed top-6 left-1/2 -translate-x-1/2 space-y-3 z-[9999] w-full flex flex-col items-center">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`flex items-start gap-3 rounded-xl border p-3 shadow-lg max-w-sm w-full sm:w-auto animate-toast-slide ${VARIANT_STYLES[t.variant]}`}
      >
        <div className="mt-0.5">{ICONS[t.variant]}</div>
        <div className="flex-1">
          {t.title && <div className="font-semibold">{t.title}</div>}
          {t.description && <div className="text-sm opacity-90">{t.description}</div>}
        </div>
        <button
          onClick={() => remove(t.id)}
          className="text-lg leading-none px-1 opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    ))}
  </div>
);

const ExamPage = () => {
  const [answers, setAnswers] = useState({});
  const [questions, setQuestions] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { testId } = useParams();
  const navigate = useNavigate();

  // Toast state
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((toast) => {
    const id = nextToastId++;
    setToasts((prev) => [...prev, { id, ...toast }]);
    if (!toast.sticky) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration || 4000);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch questions
  useEffect(() => {
    if (testId) {
      axios
        .get(`http://localhost:5000/api/test/${testId}`)
        .then((res) => setQuestions(res.data.questions))
        .catch((err) => {
          console.error("Failed to fetch questions", err);
          showToast({
            variant: "error",
            title: "Failed to load questions",
            description: "Please check your connection.",
            sticky: true,
          });
        });
    }
  }, [testId, showToast]);

  // Warning handling
  const handleWarning = (type) => {
    const messages = {
      tab_switch: {
        variant: "warning",
        title: "Tab Switching Detected",
        description: "Switching tabs is prohibited during the exam!",
      },
      inactivity: {
        variant: "info",
        title: "You seem inactive",
        description: "Please stay active to avoid warnings.",
      },
      face_not_visible: {
        variant: "warning",
        title: "Face Not Visible",
        description: "Ensure your face is clearly visible to the camera.",
      },
      text_selection: {
        variant: "warning",
        title: "Text Selection Disabled",
        description: "Selecting or copying text is not allowed.",
      },
    };
    showToast(messages[type] || {
      variant: "info",
      title: "Activity Notice",
      description: "Suspicious activity detected.",
    });
  };

  const handleAnswerChange = (index, value) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

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
      showToast({
        variant: "success",
        title: "Exam Submitted",
        description: "Your answers have been saved successfully.",
      });
      navigate("/test_result", { state: { result: res.data } });
    } catch (err) {
      showToast({
        variant: "error",
        title: "Submission Failed",
        description: "Please try again.",
        sticky: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-100 text-gray-900 min-h-screen p-4">
      {/* Toasts */}
      <ToastContainer toasts={toasts} remove={removeToast} />

      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6 text-center">Online Assessment</h2>

        <FaceDetection onWarning={handleWarning} />
        <ActivityMonitor onWarning={handleWarning} />

        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={index} className="p-4 border border-gray-300 rounded-md">
              <p className="mb-2 font-medium">{index + 1}. {q.question}</p>

              {q.question_type === "mcq" && q.options && (
                <div className="flex flex-col space-y-2">
                  {q.options.map((opt, idx) => {
                    const optionText = typeof opt === "string" ? opt : opt.text;
                    return (
                      <label
                        key={idx}
                        className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer
                          ${answers[index] === optionText
                            ? "bg-blue-100"
                            : "hover:bg-gray-100"}`}
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
