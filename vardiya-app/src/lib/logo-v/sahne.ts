/**
 * Vardiya — 3B V sahnesi (Three.js / WebGL).
 *
 * Önceki iki denemeden farkı: düz Canvas gölgelendirmesi yerine gerçek
 * malzemeler ve stüdyo ortamı. Amber ön yüz cam gibi, bevel/yan yüzler
 * grafit metal; oda ortamı yansıması sayesinde yüzeyler "oyuncak" değil,
 * cilalı bir cisim gibi okunuyor.
 *
 * Sahnede tek bir nesne var: markanın V'si. Sade, ikonik, dönen.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { sinirla } from "./matematik";

export type SahneSecenek = { hareket: boolean };

/** V'nin baktığı sanal nokta: ekran kenarı ≈ yatay 43°, dikey 30°. */
const HEDEF_X = 2.4;
const HEDEF_Y = 1.5;
const HEDEF_Z = 2.6;
/** İmleç yokken hafif aşağı bakan dinlenme açısı (radyan). */
const DINLENME_PITCH = 0.06;

type Nokta = { x: number; y: number; r: number };

/** Köşeleri yuvarlatılmış 2B yol → THREE.Shape. */
function yuvarlakYol(noktalar: Nokta[]): THREE.Shape {
  const sekil = new THREE.Shape();
  const n = noktalar.length;

  for (let i = 0; i < n; i += 1) {
    const onceki = noktalar[(i - 1 + n) % n];
    const p = noktalar[i];
    const sonraki = noktalar[(i + 1) % n];

    const d1 = Math.hypot(p.x - onceki.x, p.y - onceki.y) || 1;
    const d2 = Math.hypot(p.x - sonraki.x, p.y - sonraki.y) || 1;
    const r = Math.min(p.r, d1 / 2, d2 / 2);

    const a = new THREE.Vector2(
      p.x + ((onceki.x - p.x) / d1) * r,
      p.y + ((onceki.y - p.y) / d1) * r,
    );
    const b = new THREE.Vector2(
      p.x + ((sonraki.x - p.x) / d2) * r,
      p.y + ((sonraki.y - p.y) / d2) * r,
    );

    if (i === 0) sekil.moveTo(a.x, a.y);
    else sekil.lineTo(a.x, a.y);
    sekil.quadraticCurveTo(p.x, p.y, b.x, b.y);
  }

  sekil.closePath();
  return sekil;
}

/** Markanın V'si: dış hat + iç boşluk, yuvarlatılmış köşeler. */
function vSekli(): THREE.Shape {
  return yuvarlakYol([
    { x: -1.06, y: 0.92, r: 0.06 }, // dış sol üst
    { x: 0, y: -1.06, r: 0.12 }, // dış dip
    { x: 1.06, y: 0.92, r: 0.06 }, // dış sağ üst
    { x: 0.55, y: 0.92, r: 0.05 }, // iç sağ üst
    { x: 0, y: -0.2, r: 0.07 }, // iç dip
    { x: -0.55, y: 0.92, r: 0.05 }, // iç sol üst
  ]);
}

/** Yumuşak, hafif taşan giriş eğrisi. */
function girisEgrisi(x: number): number {
  const t = sinirla(x, 0, 1);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export class VLogoSahnesi {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private grup: THREE.Group;
  private mesh: THREE.Mesh;
  private isik: THREE.DirectionalLight;
  private rim: THREE.DirectionalLight;
  private hale: THREE.Sprite;
  private haleMalzeme: THREE.SpriteMaterial;

  private ortam: THREE.WebGLRenderTarget;
  private geometri: THREE.ExtrudeGeometry;
  private amberMalzeme: THREE.MeshPhysicalMaterial;
  private metalMalzeme: THREE.MeshPhysicalMaterial;
  private haleDoku: THREE.CanvasTexture;

  private w = 0;
  private h = 0;
  private hareket: boolean;
  private baslangic = -1;

  private hedefYaw = 0;
  private hedefPitch = DINLENME_PITCH;
  private yumusakYaw = 0;
  private yumusakPitch = DINLENME_PITCH;
  /** İmleç takibi açık mı (açıkken kendi kendine salınım kısılır). */
  private takip = false;

  constructor(tuval: HTMLCanvasElement, secenek: SahneSecenek) {
    this.hareket = secenek.hareket;

    this.renderer = new THREE.WebGLRenderer({
      canvas: tuval,
      alpha: true,
      antialias: true,
      // Geliştirme/önizleme ekran görüntüsü için; sahne hafif, etkisi küçük.
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    this.camera.position.set(0, 0.12, 6.1);
    this.camera.lookAt(0, 0, 0);

    // Stüdyo yansımaları: harici HDR dosyası yok, prosedürel oda.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.ortam = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.ortam.texture;
    pmrem.dispose();

    this.amberMalzeme = new THREE.MeshPhysicalMaterial({
      color: 0xec8b06,
      metalness: 0.5,
      roughness: 0.15,
      clearcoat: 1,
      clearcoatRoughness: 0.07,
      emissive: 0x5e2d00,
      emissiveIntensity: 0.16,
      envMapIntensity: 1.1,
    });

    this.metalMalzeme = new THREE.MeshPhysicalMaterial({
      color: 0x14171a,
      metalness: 1,
      roughness: 0.3,
      clearcoat: 0.9,
      clearcoatRoughness: 0.18,
      envMapIntensity: 1.35,
    });

    this.geometri = new THREE.ExtrudeGeometry(vSekli(), {
      depth: 0.38,
      bevelEnabled: true,
      bevelThickness: 0.09,
      bevelSize: 0.075,
      bevelSegments: 7,
      curveSegments: 26,
    });
    this.geometri.center();

    // Ön yüze dikey amber gradyan: düz boya değil, derin emaye gibi.
    const konum = this.geometri.getAttribute("position");
    let enAlt = Infinity;
    let enUst = -Infinity;
    for (let i = 0; i < konum.count; i += 1) {
      const y = konum.getY(i);
      if (y < enAlt) enAlt = y;
      if (y > enUst) enUst = y;
    }
    const renkler = new Float32Array(konum.count * 3);
    const altRenk = new THREE.Color(0xbf6600);
    const ustRenk = new THREE.Color(0xffc24a);
    const gecici = new THREE.Color();
    const aralik = Math.max(enUst - enAlt, 0.001);
    for (let i = 0; i < konum.count; i += 1) {
      const t = Math.pow((konum.getY(i) - enAlt) / aralik, 1.25);
      gecici.copy(altRenk).lerp(ustRenk, t);
      renkler[i * 3] = gecici.r;
      renkler[i * 3 + 1] = gecici.g;
      renkler[i * 3 + 2] = gecici.b;
    }
    this.geometri.setAttribute("color", new THREE.BufferAttribute(renkler, 3));
    this.amberMalzeme.vertexColors = true;
    this.amberMalzeme.color.set(0xffffff);

    this.mesh = new THREE.Mesh(this.geometri, [
      this.amberMalzeme,
      this.metalMalzeme,
    ]);

    this.grup = new THREE.Group();
    // Önce yatay (yaw), sonra dikey (pitch): imleci "takip eden" doğal sıra.
    this.grup.rotation.order = "YXZ";
    this.grup.add(this.mesh);
    this.scene.add(this.grup);

    this.isik = new THREE.DirectionalLight(0xffe7c4, 2.8);
    this.isik.position.set(3.4, 4.2, 4.6);
    this.scene.add(this.isik);

    this.rim = new THREE.DirectionalLight(0x9dc4ff, 1.7);
    this.rim.position.set(-4.2, 0.4, -2.4);
    this.scene.add(this.rim);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.22));

    // Amber hâle: V'nin arkasında yumuşak bir ışık.
    this.haleDoku = this.haleDokusu();
    this.haleMalzeme = new THREE.SpriteMaterial({
      map: this.haleDoku,
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.hale = new THREE.Sprite(this.haleMalzeme);
    this.hale.scale.set(4.6, 4.6, 1);
    this.hale.position.set(0, 0, -1.1);
    this.scene.add(this.hale);
  }

  /** 256×256 yumuşak radyal ışık dokusu. */
  private haleDokusu(): THREE.CanvasTexture {
    const boyut = 256;
    const tuval = document.createElement("canvas");
    tuval.width = boyut;
    tuval.height = boyut;
    const ctx = tuval.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(
        boyut / 2,
        boyut / 2,
        0,
        boyut / 2,
        boyut / 2,
        boyut / 2,
      );
      g.addColorStop(0, "rgba(255, 190, 80, 0.85)");
      g.addColorStop(0.35, "rgba(245, 158, 11, 0.35)");
      g.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, boyut, boyut);
    }
    const doku = new THREE.CanvasTexture(tuval);
    doku.colorSpace = THREE.SRGBColorSpace;
    return doku;
  }

  boyutla(w: number, h: number, dpr: number): void {
    this.w = w;
    this.h = h;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(h, 1);
    // Dar ekranlarda V'yi biraz geri çek.
    this.camera.position.z = w < h ? 6.6 : 6.1;
    this.camera.updateProjectionMatrix();
  }

  /**
   * İmleç konumu — ekranın tamamına göre -1..1 (sol üst = -1,-1).
   * V, imlecin bulunduğu yöne bakar: sağdaysa sağa, yukarıdaysa yukarı döner.
   */
  isaretle(x: number, y: number): void {
    const nx = sinirla(x, -1, 1);
    const ny = sinirla(y, -1, 1);
    const hx = nx * HEDEF_X;
    const hy = -ny * HEDEF_Y; // ekranda aşağı = dünyada aşağı
    const uzunluk = Math.hypot(hx, hy, HEDEF_Z) || 1;
    this.hedefYaw = Math.atan2(hx, HEDEF_Z);
    this.hedefPitch = -Math.asin(hy / uzunluk);
    this.takip = true;
  }

  /** İmleç pencereden çıktı: öne, hafif aşağı bakışa dön. */
  isaretBirak(): void {
    this.hedefYaw = 0;
    this.hedefPitch = DINLENME_PITCH;
    this.takip = false;
  }

  hareketAyarla(deger: boolean): void {
    this.hareket = deger;
  }

  ciz(zaman: number, dt: number): void {
    if (this.w < 1 || this.h < 1) return;
    if (this.baslangic < 0) this.baslangic = zaman;

    const gecen = zaman - this.baslangic;
    const t = this.hareket ? gecen : 2.6;

    const yumusaklik = 1 - Math.exp(-Math.max(dt, 0) * 6);
    this.yumusakYaw += (this.hedefYaw - this.yumusakYaw) * yumusaklik;
    this.yumusakPitch += (this.hedefPitch - this.yumusakPitch) * yumusaklik;

    // Giriş: hafif taşarak yerine oturur.
    const g = this.hareket ? girisEgrisi(gecen / 1.1) : 1;
    const olcek = 0.72 + 0.28 * g;

    // İmleç yokken (özellikle dokunmatikte) kendi kendine salınır; imleç
    // varken salınım kısılır ki V tam olarak imlece baksın.
    const salinim = this.takip ? 0.02 : 0.12;

    const yaw =
      this.yumusakYaw + (this.hareket ? Math.sin(t * 0.3) * salinim : 0) + (1 - g) * -0.5;
    const pitch =
      this.yumusakPitch + (this.hareket ? Math.sin(t * 0.22 + 1) * (this.takip ? 0.012 : 0.03) : 0);
    const roll = this.hareket ? Math.sin(t * 0.17) * 0.02 : 0;

    this.grup.rotation.set(pitch, yaw, roll);
    this.grup.position.y = this.hareket ? Math.sin(t * 0.8) * 0.055 : 0;
    this.grup.scale.setScalar(olcek);

    // Işık gezintisi: cilalı yüzeyde parlama yer değiştirir.
    if (this.hareket) {
      this.isik.position.set(
        Math.sin(t * 0.34) * 4.4,
        4.1 + Math.sin(t * 0.5) * 0.5,
        4.4 + Math.cos(t * 0.34) * 2.1,
      );
      this.haleMalzeme.opacity = 0.38 + Math.sin(t * 0.85) * 0.06;
    }

    this.renderer.render(this.scene, this.camera);
  }

  bosalt(): void {
    this.geometri.dispose();
    this.amberMalzeme.dispose();
    this.metalMalzeme.dispose();
    this.haleDoku.dispose();
    this.haleMalzeme.dispose();
    this.ortam.dispose();
    this.renderer.dispose();
  }
}
