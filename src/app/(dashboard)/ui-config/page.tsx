import { getUIConfig } from "@/lib/getUIConfig";
import UIConfigForm from "./UIConfigForm";

export default async function AdminUIConfigPage() {
  const page = "survey"; // later dropdown se dynamic
  const config = await getUIConfig(page);

  return (
    <div className="p-2  mx-auto">
      <UIConfigForm page={page} initialConfig={config} />
    </div>
  );
}
