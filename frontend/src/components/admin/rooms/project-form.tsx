"use client";

import { useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { Button, Field, Notice } from "@/components/ui";
import { useSubmit } from "@/components/use-submit";
import { CheckField, flag, num, options, SelectField, str, TextArea, tri, TriField } from "./form-bits";
import { PET_POLICY, Project } from "./model";

// PUT replaces the whole project, so the fields this form does not show (area ids, owner, manager) are sent back unchanged.
export function buildProjectBody(project: Project, data: FormData) {
  return {
    name: str(data, "name"),
    streetAddress: str(data, "streetAddress"),
    wardId: project.wardId,
    wardNewId: project.wardNewId,
    districtId: project.districtId,
    lat: num(data, "lat"),
    lng: num(data, "lng"),
    ownerUserId: project.ownerUserId,
    managerUserId: project.managerUserId,
    exclusive: flag(data, "exclusive"),
    petPolicy: str(data, "petPolicy"),
    evParking: flag(data, "evParking"),
    freeHours: tri(data, "freeHours"),
    maxGuestsNote: str(data, "maxGuestsNote"),
    houseRules: str(data, "houseRules"),
    feeElectric: num(data, "feeElectric"),
    feeWater: num(data, "feeWater"),
    feeService: num(data, "feeService"),
    feeParking: num(data, "feeParking"),
    feeNote: str(data, "feeNote"),
    description: str(data, "description"),
  };
}

export function ProjectForm({ project, onSaved }: { project: Project; onSaved: () => void }) {
  const { busy, error, run } = useSubmit();
  const [saved, setSaved] = useState(false);
  const fee = (name: string, label: string, value: number | null) => (
    <Field label={label} name={name} type="number" inputMode="numeric" min={0} step={1} defaultValue={value ?? ""} />
  );

  return (
    <form
      className="step-in max-w-3xl space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(false);
        const data = new FormData(e.currentTarget);
        run(async () => {
          await adminApi(`projects/${project.id}`, { method: "PUT", body: buildProjectBody(project, data) });
          setSaved(true);
          onSaved();
        });
      }}
    >
      <Field label="Tên dự án" name="name" required maxLength={200} defaultValue={project.name} hint={`Đường dẫn: /${project.slug}. Đổi tên sẽ tạo đường dẫn mới.`} />
      <Field label="Địa chỉ" name="streetAddress" maxLength={300} defaultValue={project.streetAddress ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vĩ độ" name="lat" type="number" step="any" min={-90} max={90} defaultValue={project.lat ?? ""} />
        <Field label="Kinh độ" name="lng" type="number" step="any" min={-180} max={180} defaultValue={project.lng ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Nuôi thú cưng" name="petPolicy" defaultValue={project.petPolicy} required>
          {options(PET_POLICY)}
        </SelectField>
        <TriField label="Giờ giấc tự do" name="freeHours" value={project.freeHours} />
      </div>
      <div className="flex flex-wrap gap-x-8">
        <CheckField label="Độc quyền TTHome" name="exclusive" defaultChecked={project.exclusive} />
        <CheckField label="Có chỗ sạc xe điện" name="evParking" defaultChecked={project.evParking} />
      </div>
      <Field label="Ghi chú số người ở" name="maxGuestsNote" maxLength={500} defaultValue={project.maxGuestsNote ?? ""} />
      <TextArea label="Nội quy" name="houseRules" maxLength={5000} defaultValue={project.houseRules ?? ""} />
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="col-span-full mb-3 text-sm font-medium text-ink-soft">Các khoản phí (₫)</legend>
        {fee("feeElectric", "Điện", project.feeElectric)}
        {fee("feeWater", "Nước", project.feeWater)}
        {fee("feeService", "Dịch vụ", project.feeService)}
        {fee("feeParking", "Gửi xe", project.feeParking)}
      </fieldset>
      <Field label="Ghi chú phí" name="feeNote" maxLength={1000} defaultValue={project.feeNote ?? ""} />
      <TextArea label="Mô tả hiển thị trên web" name="description" rows={8} maxLength={20000} defaultValue={project.description ?? ""} />
      <Notice>{error}</Notice>
      {saved && !error && <Notice tone="ok">Đã lưu thông tin dự án.</Notice>}
      <div className="w-40">
        <Button busy={busy}>Lưu thông tin</Button>
      </div>
    </form>
  );
}
