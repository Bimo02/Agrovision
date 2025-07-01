import PropTypes from "prop-types";

const CustomTooltip = ({ active, payload, hoveredBar }) => {
  if (active && payload && payload.length > 0) {
    // البحث عن الـ Bar اللي الماوس عليه فقط
    const entry = payload.find((p) => p.dataKey === hoveredBar);
    if (!entry) return null;

    const isPaid = entry.dataKey === "paid";
    const label = isPaid ? "Paid" : "Unpaid";

    return (
      <div className="custom-tooltip p-2 shadow bg-white rounded">
        <p className="fw-bold">{`${entry.value} ${label} Invoices`}</p>
        <p className="text-muted small">{`${entry.payload.month} 21th, 2020`}</p>
      </div>
    );
  }
  return null;
};

// ✅ إضافة PropTypes لمنع تحذيرات ESLint
CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  hoveredBar: PropTypes.string,
};

export default CustomTooltip;
