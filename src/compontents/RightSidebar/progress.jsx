import ProgressBar from "react-bootstrap/ProgressBar";
import "./progress.css";

function BasicExample({ progress }) {
  return <ProgressBar now={progress} />;
}

export default BasicExample;
