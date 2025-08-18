import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import InstructionsPage from "./pages/InstructionsPage";
import ExamPage from "./pages/ExamPage";
import TestResult from "./pages/TestResult";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InstructionsPage />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/instructions/:testId" element={<InstructionsPage />} />
        <Route path="/test/:testId" element={<ExamPage />} />
        <Route path="/test_result" element={<TestResult />} />
      </Routes>
    </Router>
  );
}

export default App;
