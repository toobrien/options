// real-time data setting
import { set_real_time_data } from "../src/browser_utils.js";

const data_checkbox = document.getElementById("real_time_data");
data_checkbox.checked = false;
data_checkbox.addEventListener("change", set_real_time_data);
set_real_time_data();                                                           // don't want auto-login

// tabs
import { load_content } from "../src/tabs.js";

[
  "options_chain",
  "options_chart",
  "returns_histogram",
  "time_and_sales",
  "market_profile"
].forEach((component) => {
  document.getElementById(`${component}_tab_button`)
    .addEventListener("click", () => { load_content(component); });
});

// clients
import { basic_client } from "../src/basic_client.js";
import { stream_client } from "../src/stream_client.js";

const b_client = new basic_client();
const s_client = new stream_client();

// components
import { options_chain } from "../src/options_chain.js";
import { options_chart } from "../src/options_chart.js";
import { returns_histogram } from "../src/returns_histogram.js";
import { time_and_sales } from "../src/time_and_sales.js";
import { market_profile } from "../src/market_profile.js";

const chain = new options_chain(b_client);
const chart = new options_chart(b_client);
const hist = new returns_histogram(b_client);
const tape = new time_and_sales(s_client);
const mp = new market_profile(b_client);

// component forms
// need to decouple parameter getters from component implementations
document.getElementById("options_chain_refresh_contracts_button")
  .addEventListener("click", () => { chain.refresh_contracts(); });
document.getElementById("returns_histogram_retrieve_histogram_button")
  .addEventListener("click", () => { hist.retrieve_histogram(); });
document.getElementById("time_and_sales_add_contracts_button")
  .addEventListener("click", () => { tape.add_contracts(); });
document.getElementById("time_and_sales_remove_contracts_button")
  .addEventListener("click", () => { tape.remove_contracts(); });
document.getElementById("market_profile_get_chart_button")
  .addEventListener("click", () => { mp.get_chart_data(); });
document.getElementById("options_chart_symbol_refresh")
  .addEventListener("click", () => { chart.refresh(); });
