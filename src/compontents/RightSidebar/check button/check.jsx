import Form from "react-bootstrap/Form";
import "./check.css";

function CheckButton({ checked, onChange }) {
  return (
    <Form>
      <Form.Check
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
    </Form>
  );
}

export default CheckButton;
