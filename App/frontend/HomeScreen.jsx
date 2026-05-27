/* Home — Định Giá valuation form.

   Form schema matches the backend exactly:
   preprocessing_tfidf_v2.ipynb (cell 2 "schema mapping" + cell 9 "kw_*")
   → train_model_tfidf_v2.ipynb (filter to bds__nha_o ∪ bds__can_ho).

   Only fields the model actually consumes appear here. Fields that
   look natural to ask (số tầng, hướng, năm xây) but aren't in the
   feature set were removed — surfacing them would imply the model
   uses them, which would be a lie. */

function HomeScreen({ form, setForm, onSubmit }) {
  const D = window.DG_DATA;
  const M = window.DG_MODEL;
  const update = (k) => (v) => setForm({ ...form, [k]: v });

  // Districts filtered by selected city
  const cityDistricts = D.districts.filter((d) => d.city === form.city);
  const wards = D.wards[form.district] || [];

  // Auto-detect keyword flags from the description, with manual overrides
  const detected = window.detectKeywords((form.title || "") + " " + (form.description || ""));
  const resolveKw = (id) => {
    const o = form.keyword_overrides?.[id];
    return o == null ? detected[id] : o;
  };
  const toggleKw = (id) => {
    const cur = resolveKw(id);
    setForm({
      ...form,
      keyword_overrides: { ...form.keyword_overrides, [id]: !cur },
    });
  };

  const canSubmit =
    form.area_m2 && +form.area_m2 > 0 &&
    form.bedrooms && form.district && form.city;

  return (
    <div data-screen-label="01 Định giá">
      {/* Hero */}
      <div className="paper-ruled" style={{ padding: "48px 56px 40px", marginLeft: -56, marginRight: -56, marginTop: -40, marginBottom: 32, borderBottom: "1px solid var(--rule)" }}>
        <Eyebrow>Định giá nhà bằng AI · LightGBM v8</Eyebrow>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(48px, 6vw, 80px)",
            lineHeight: 0.98,
            letterSpacing: "-0.025em",
            margin: "14px 0 18px",
            maxWidth: 900,
          }}
        >
          Hiểu giá trị nhà của bạn <em>— trong 30 giây.</em>
        </h1>
        <p style={{ fontSize: 17, color: "var(--ink-2)", lineHeight: 1.5, maxWidth: 640, margin: 0 }}>
          Mô tả căn nhà của bạn — diện tích, vị trí, vài câu giới thiệu — Định Giá so sánh
          rồi trả về ước lượng kèm khoảng tin cậy 80%.
        </p>
      </div>

      {/* Form */}
      <div className="card" style={{ padding: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <Eyebrow>Thông tin căn nhà</Eyebrow>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, letterSpacing: "-0.015em", margin: "8px 0 0" }}>
              Cho mình biết bạn đang định giá căn nào
            </h2>
          </div>
          <span className="muted" style={{ fontSize: 13 }}>* các trường bắt buộc</span>
        </div>

        <hr className="rule-ink" style={{ marginBottom: 28 }} />

        {/* ─────────── Section 1: Loại BĐS ─────────── */}
        <Eyebrow>1 · Loại bất động sản</Eyebrow>
        <div style={{ marginTop: 12, marginBottom: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {D.property_types.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => update("property_type")(p.id)}
                className={"type-card" + (form.property_type === p.id ? " active" : "")}
              >
                <span style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "-0.01em" }}>{p.label}</span>
                <span className="muted" style={{ fontSize: 13, marginTop: 2 }}>{p.note}</span>
              </button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.4 }}>
            Model hiện chỉ predict cho 2 loại này — đất nền, văn phòng, kho bãi tạm thời chưa hỗ trợ
            (đã bị loại khỏi training set ở bước filter).
          </p>
        </div>

        <hr className="rule-hair" style={{ margin: "28px 0" }} />

        {/* ─────────── Section 2: Vị trí ─────────── */}
        <Eyebrow>2 · Vị trí</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 12 }}>
          <Field label="Thành phố *">
            <Select
              value={form.city}
              onChange={(v) => {
                const first = D.districts.find((d) => d.city === v);
                setForm({
                  ...form,
                  city: v,
                  district: first ? first.id : "",
                  ward: "",
                });
              }}
              options={D.cities}
            />
          </Field>
          <Field label="Quận / Huyện *" hint={`${cityDistricts.length} quận có trong dataset`}>
            <Select
              value={form.district}
              onChange={(v) => setForm({ ...form, district: v, ward: "" })}
              options={cityDistricts.map((d) => ({ id: d.id, label: d.name }))}
            />
          </Field>
          <Field
            label="Phường / Xã"
            hint={wards.length ? `${wards.length} phường — tăng độ chính xác` : "Chưa có dữ liệu phường — sẽ fallback về quận"}
          >
            <Select
              value={form.ward}
              onChange={update("ward")}
              options={[{ id: "", label: "— chọn phường —" }, ...wards.map((w) => ({ id: w.id, label: w.name }))]}
            />
          </Field>
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.4 }}>
          Vị trí được mã hoá thành <code>district_te</code>, <code>ward_te</code>, và
          khoảng cách haversine tới 4 trung tâm thành phố (HCM, HN, ĐN, BD).
        </p>

        <hr className="rule-hair" style={{ margin: "28px 0" }} />

        {/* ─────────── Section 3: Diện tích & phòng ─────────── */}
        <Eyebrow>3 · Diện tích & phòng</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 12 }}>
          <Field label="Diện tích *" suffix="m²" hint="0 – 10.000 m²">
            <Input value={form.area_m2} onChange={update("area_m2")} placeholder="82" />
          </Field>
          <Field label="Phòng ngủ *">
            <Input value={form.bedrooms} onChange={update("bedrooms")} placeholder="3" />
          </Field>
          <Field label="Phòng vệ sinh">
            <Input value={form.toilets} onChange={update("toilets")} placeholder="2" />
          </Field>
        </div>

        <hr className="rule-hair" style={{ margin: "28px 0" }} />

        {/* ─────────── Section 4: Mô tả tự do ─────────── */}
        <Eyebrow>4 · Tiêu đề & mô tả</Eyebrow>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, margin: "8px 0 16px", maxWidth: 640 }}>
          Phần text này được mô hình xử lý bằng TF-IDF + LSA (30 components) — nó <em>quan trọng</em>:
          các đặc điểm như view sông, hẻm xe hơi, sổ hồng, mặt tiền sẽ được nhận diện tự động.
        </p>
        <div style={{ display: "grid", gap: 20 }}>
          <Field label="Tiêu đề tin đăng">
            <Input
              value={form.title}
              onChange={update("title")}
              placeholder="VD. Nhà phố Phú Mỹ Hưng — hẻm xe hơi 8m, sổ hồng chính chủ"
            />
          </Field>
          <Field label="Mô tả chi tiết" hint="Càng cụ thể, dự đoán càng chính xác">
            <Textarea
              value={form.description}
              onChange={update("description")}
              rows={5}
              placeholder="Mô tả vị trí, tình trạng nhà, tiện ích xung quanh, pháp lý…"
            />
          </Field>
        </div>

        <hr className="rule-hair" style={{ margin: "28px 0" }} />

        {/* ─────────── Section 5: Đặc điểm (auto-detected) ─────────── */}
        <Eyebrow>5 · Đặc điểm phát hiện được</Eyebrow>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, margin: "8px 0 16px", maxWidth: 640 }}>
          Tự động phát hiện từ mô tả ở trên — bạn có thể bấm để bật/tắt nếu sai.
          Mỗi cờ tương ứng với một regex trong preprocessing pipeline.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {D.keywords.map((kw) => {
            const active = resolveKw(kw.id);
            const overridden = form.keyword_overrides?.[kw.id] != null;
            return (
              <Chip key={kw.id} active={active} onClick={() => toggleKw(kw.id)}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span className="t-mono" style={{ fontSize: 10, opacity: 0.5 }}>{kw.impact}</span>
                  {kw.label}
                  {overridden && <span className="t-mono" style={{ fontSize: 10, opacity: 0.6 }}>· chỉnh tay</span>}
                </span>
              </Chip>
            );
          })}
        </div>

        <hr className="rule-hair" style={{ marginTop: 36, marginBottom: 24 }} />
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="primary" size="lg" iconRight="arrow-right" onClick={onSubmit} disabled={!canSubmit}>
              Định giá ngay
            </Button>
        </div>
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
