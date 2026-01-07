import ThankYouConfigForm from "./ThankyouConfigForm";
import { getThankYouConfig } from "@/lib/getThankyouConfig";

export default async function AdminThankYouPage() {
  const page = "thank-you";
  const data = await getThankYouConfig(page);

  return (
    <div className="p-4  mx-auto">
      

      <ThankYouConfigForm page={page}  />
    </div>
  );
}
