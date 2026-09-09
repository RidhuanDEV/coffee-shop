import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { sequelize } from "../config/database.js";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";
import { loadModels } from "./models/index.js";
import {
  Category,
  Product,
  CafeTable,
  ShopSettings,
} from "../modules/coffee/coffee.model.js";
import { Role } from "../modules/roles/role.model.js";
import { Permission } from "../modules/permissions/permission.model.js";
import { RolePermission } from "../modules/roles/role-permission.model.js";
import { User } from "../modules/user/user.model.js";
import type { LocalizedText } from "../modules/coffee/coffee.types.js";
const tr = (id: string, en: string, ms: string): LocalizedText => ({
  id,
  en,
  ms,
});
interface SeedProduct {
  name: string;
  category: string;
  price: number;
  description: LocalizedText;
  image: string;
}
const products: SeedProduct[] = [
  {
    name: "Smoked Beef Croissant",
    category: "food",
    price: 48000,
    description: tr(
      "Croissant renyah, daging asap, dan keju.",
      "Flaky croissant, smoked beef and cheese.",
      "Kroisan rangup, daging salai dan keju.",
    ),
    image: "pastry",
  },
  {
    name: "Chicken Sandwich",
    category: "food",
    price: 42000,
    description: tr(
      "Ayam panggang dan sayuran segar.",
      "Grilled chicken with fresh greens.",
      "Ayam panggang dengan sayuran segar.",
    ),
    image: "food",
  },
  {
    name: "Spaghetti Aglio e Olio",
    category: "food",
    price: 55000,
    description: tr(
      "Pasta dengan bawang putih dan minyak zaitun.",
      "Pasta with garlic and olive oil.",
      "Pasta dengan bawang putih dan minyak zaitun.",
    ),
    image: "food",
  },
  {
    name: "Truffle Fries",
    category: "food",
    price: 35000,
    description: tr(
      "Kentang goreng dengan aroma truffle.",
      "Golden fries with truffle aroma.",
      "Kentang goreng dengan aroma trufel.",
    ),
    image: "food",
  },
  {
    name: "Chicken Rice Bowl",
    category: "food",
    price: 45000,
    description: tr(
      "Nasi hangat dengan ayam berbumbu.",
      "Seasoned chicken over warm rice.",
      "Nasi panas dengan ayam berempah.",
    ),
    image: "food",
  },
  {
    name: "Espresso",
    category: "beverage",
    price: 18000,
    description: tr(
      "Ekstraksi pekat dengan akhir rasa manis.",
      "A concentrated shot with a sweet finish.",
      "Kopi pekat dengan rasa akhir manis.",
    ),
    image: "espresso",
  },
  {
    name: "Americano",
    category: "beverage",
    price: 25000,
    description: tr(
      "Espresso dan air, bersih dan seimbang.",
      "Espresso and water, clean and balanced.",
      "Espreso dan air, bersih dan seimbang.",
    ),
    image: "espresso",
  },
  {
    name: "Cafe Latte",
    category: "beverage",
    price: 32000,
    description: tr(
      "Espresso dengan susu lembut.",
      "Espresso with silky steamed milk.",
      "Espreso dengan susu yang lembut.",
    ),
    image: "latte",
  },
  {
    name: "Cappuccino",
    category: "beverage",
    price: 32000,
    description: tr(
      "Keseimbangan kopi, susu, dan busa.",
      "A balance of coffee, milk and foam.",
      "Keseimbangan kopi, susu dan buih.",
    ),
    image: "latte",
  },
  {
    name: "Matcha Latte",
    category: "beverage",
    price: 38000,
    description: tr(
      "Matcha dengan susu, lembut dan menenangkan.",
      "Smooth matcha and milk.",
      "Matcha dengan susu yang lembut.",
    ),
    image: "matcha",
  },
  {
    name: "Burnt Cheesecake",
    category: "dessert",
    price: 42000,
    description: tr(
      "Cheesecake lembut dengan karamel panggang.",
      "Creamy cheesecake with a caramelised top.",
      "Kek keju lembut dengan permukaan karamel.",
    ),
    image: "cake",
  },
  {
    name: "Tiramisu",
    category: "dessert",
    price: 45000,
    description: tr(
      "Lapisan mascarpone dan kopi.",
      "Layers of mascarpone and coffee.",
      "Lapisan mascarpone dan kopi.",
    ),
    image: "cake",
  },
  {
    name: "Chocolate Brownie",
    category: "dessert",
    price: 28000,
    description: tr(
      "Cokelat pekat dengan tekstur fudgy.",
      "Rich chocolate with a fudgy centre.",
      "Coklat pekat dengan tekstur lembut.",
    ),
    image: "cake",
  },
  {
    name: "Croffle",
    category: "dessert",
    price: 30000,
    description: tr(
      "Pastri renyah dengan sirup maple.",
      "Crisp pastry with maple syrup.",
      "Pastri rangup dengan sirap maple.",
    ),
    image: "pastry",
  },
  {
    name: "Panna Cotta",
    category: "dessert",
    price: 35000,
    description: tr(
      "Puding krim vanila dan saus buah.",
      "Vanilla cream pudding with fruit sauce.",
      "Puding krim vanila dengan sos buah.",
    ),
    image: "cake",
  },
];
async function seed(): Promise<void> {
  if (env.NODE_ENV === "production")
    throw new Error("Demo seed is forbidden in production");
  await loadModels(sequelize);
  await sequelize.authenticate();
  await sequelize.transaction(async (transaction) => {
    const [admin] = await Role.findOrCreate({
      where: { name: "admin" },
      defaults: { name: "admin" },
      transaction,
    });
    const [staff] = await Role.findOrCreate({
      where: { name: "staff" },
      defaults: { name: "staff" },
      transaction,
    });
    for (const name of [
      "manage_users",
      "manage_roles",
      "manage_permissions",
      "view_orders",
      "update_orders",
    ]) {
      const [permission] = await Permission.findOrCreate({
        where: { name },
        defaults: { name },
        transaction,
      });
      await RolePermission.findOrCreate({
        where: { roleId: admin.id, permissionId: permission.id },
        defaults: { roleId: admin.id, permissionId: permission.id },
        transaction,
      });
      if (name.endsWith("_orders"))
        await RolePermission.findOrCreate({
          where: { roleId: staff.id, permissionId: permission.id },
          defaults: { roleId: staff.id, permissionId: permission.id },
          transaction,
        });
    }
    const email = process.env["DEV_ADMIN_EMAIL"],
      password = process.env["DEV_ADMIN_PASSWORD"];
    if (email && password) {
      if (password.length < 12)
        throw new Error(
          "DEV_ADMIN_PASSWORD must contain at least 12 characters",
        );
      await User.findOrCreate({
        where: { email },
        defaults: {
          email,
          password: await bcrypt.hash(password, 12),
          roleId: admin.id,
        },
        transaction,
      });
    }
    let sortOrder = 0;
    for (const [slug, name] of [
      ["food", tr("Makanan", "Food", "Makanan")],
      ["beverage", tr("Minuman", "Beverage", "Minuman")],
      ["dessert", tr("Hidangan Penutup", "Dessert", "Pencuci Mulut")],
    ] satisfies [string, LocalizedText][]) {
      const [category] = await Category.findOrCreate({
        where: { slug },
        defaults: { slug, name, sortOrder: sortOrder++ },
        transaction,
      });
      for (const product of products.filter((p) => p.category === slug)) {
        const productSlug = product.name.toLowerCase().replaceAll(" ", "-");
        await Product.findOrCreate({
          where: { slug: productSlug },
          defaults: {
            slug: productSlug,
            name: tr(product.name, product.name, product.name),
            description: product.description,
            categoryId: category.id,
            image: `/assets/${product.image}.webp`,
            price: product.price,
            featured: [
              "Cafe Latte",
              "Burnt Cheesecake",
              "Smoked Beef Croissant",
            ].includes(product.name),
          },
          transaction,
        });
      }
    }
    for (let i = 1; i <= 20; i++) {
      const code = String(i).padStart(2, "0");
      await CafeTable.findOrCreate({
        where: { code },
        defaults: {
          code,
          name: code,
          token: randomBytes(24).toString("hex"),
          area: i > 12 ? "Terrace" : "Indoor",
        },
        transaction,
      });
    }
    if (!(await ShopSettings.findOne({ transaction })))
      await ShopSettings.create(
        {
          name: "Toko Kopi",
          hours: tr(
            "Setiap hari · 08.00–22.00",
            "Every day · 08:00–22:00",
            "Setiap hari · 08:00–22:00",
          ),
          story: tr(
            "Ruang untuk berhenti sejenak. Kami percaya secangkir kopi yang baik memberi ruang bagi percakapan, ide, dan hal sederhana.",
            "A space to slow down. We believe a good cup of coffee makes room for conversation, ideas and simple pleasures.",
            "Ruang untuk berehat seketika. Kami percaya secawan kopi yang baik memberi ruang untuk perbualan, idea dan perkara sederhana.",
          ),
          promotion: tr(
            "Temukan pasangan kopi dan hidangan favorit Anda.",
            "Find your favourite coffee and food pairing.",
            "Temui padanan kopi dan hidangan kegemaran anda.",
          ),
        },
        { transaction },
      );
  });
  console.info(
    "Coffee seed complete: 15 products, 3 categories, 20 tables. Existing records preserved.",
  );
}
try {
  await seed();
} finally {
  await sequelize.close();
  redis.disconnect();
}
