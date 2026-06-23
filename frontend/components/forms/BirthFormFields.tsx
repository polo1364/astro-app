"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input, Label, Select, FieldGroup, FormGrid } from "@/components/ui/FormControls";
import { taiwanCities } from "@/lib/data/locations";
import { useMounted } from "@/lib/hooks/useMounted";
import type { BirthFormData } from "@/lib/data/types";

interface BirthFormFieldsProps {
  data: BirthFormData;
  onChange: (data: BirthFormData) => void;
  idPrefix?: string;
  defaultAdvancedOpen?: boolean;
}

export function BirthFormFields({
  data,
  onChange,
  idPrefix = "",
  defaultAdvancedOpen = false,
}: BirthFormFieldsProps) {
  const [advancedOpen, setAdvancedOpen] = useState(defaultAdvancedOpen);
  const mounted = useMounted();
  const id = (name: string) => (idPrefix ? `${idPrefix}-${name}` : name);

  function set(field: keyof BirthFormData, fieldValue: string) {
    onChange({ ...data, [field]: fieldValue });
  }

  function handleCity(cityName: string) {
    const city = taiwanCities.find((c) => c.name === cityName);
    if (city) {
      onChange({ ...data, city: cityName, latitude: city.lat, longitude: city.lng });
    }
  }

  return (
    <div className="space-y-3">
      <FieldGroup>
        <Label htmlFor={id("name")}>姓名</Label>
        <Input
          id={id("name")}
          placeholder="選填"
          value={data.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </FieldGroup>

      <FormGrid>
        <FieldGroup>
          <Label htmlFor={id("date")}>出生日期</Label>
          {mounted ? (
            <Input
              id={id("date")}
              type="date"
              value={data.date}
              onChange={(e) => set("date", e.target.value)}
            />
          ) : (
            <Input id={id("date")} type="text" value={data.date} readOnly tabIndex={-1} />
          )}
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor={id("time")}>出生時間</Label>
          {mounted ? (
            <Input
              id={id("time")}
              type="time"
              value={data.time}
              disabled={data.birthTimeUnknown}
              onChange={(e) => set("time", e.target.value)}
            />
          ) : (
            <Input
              id={id("time")}
              type="text"
              value={data.time}
              readOnly
              tabIndex={-1}
              disabled={data.birthTimeUnknown}
            />
          )}
        </FieldGroup>
      </FormGrid>

      <label className="flex items-center gap-2 text-caption text-text-secondary cursor-pointer">
        <input
          type="checkbox"
          checked={data.birthTimeUnknown}
          onChange={(e) =>
            onChange({ ...data, birthTimeUnknown: e.target.checked })
          }
          className="rounded border-border-subtle"
        />
        出生時間不詳（將無法分析上升與宮位）
      </label>

      <FieldGroup>
        <Label htmlFor={id("city")}>台灣城市快選</Label>
        <Select
          id={id("city")}
          value={data.city}
          onChange={(e) => handleCity(e.target.value)}
        >
          <option value="" disabled>
            選擇城市
          </option>
          {taiwanCities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>
      </FieldGroup>

      <button
        type="button"
        onClick={() => setAdvancedOpen((o) => !o)}
        className="flex items-center gap-1 text-caption text-text-muted hover:text-text-secondary transition-colors"
      >
        {advancedOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        進階選項
      </button>

      {advancedOpen && (
        <div className="space-y-3 pt-1">
          <FieldGroup>
            <Label htmlFor={id("timezone")}>時區</Label>
            <Select
              id={id("timezone")}
              value={data.timezone}
              onChange={(e) => set("timezone", e.target.value)}
            >
              <option value="Asia/Taipei">Asia/Taipei (UTC+8)</option>
              <option value="UTC">UTC</option>
            </Select>
          </FieldGroup>
          <FormGrid>
            <FieldGroup>
              <Label htmlFor={id("lat")}>緯度</Label>
              <Input
                id={id("lat")}
                value={data.latitude}
                onChange={(e) => set("latitude", e.target.value)}
              />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor={id("lng")}>經度</Label>
              <Input
                id={id("lng")}
                value={data.longitude}
                onChange={(e) => set("longitude", e.target.value)}
              />
            </FieldGroup>
          </FormGrid>
          <FieldGroup>
            <Label htmlFor={id("house")}>宮位制</Label>
            <Select
              id={id("house")}
              value={data.houseSystem}
              onChange={(e) => set("houseSystem", e.target.value)}
            >
              <option value="Placidus">Placidus</option>
              <option value="Whole Sign">Whole Sign</option>
              <option value="Koch">Koch</option>
            </Select>
          </FieldGroup>
        </div>
      )}
    </div>
  );
}
