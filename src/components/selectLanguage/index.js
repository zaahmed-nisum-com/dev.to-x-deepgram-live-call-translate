import React from "react";
import Select from "react-select";

function LanguageSelect(props) {
  return (
    <Select
      value={props.selectedValue}
      onChange={props.handleChange}
      options={props.options}
    />
  );
}

export default LanguageSelect;
