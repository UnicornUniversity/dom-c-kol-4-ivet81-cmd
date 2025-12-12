/**
 * Number of milliseconds in an average year (365.25 days).
 * Used for generating and calculating age.
 */
const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

/**
 * Employee record.
 * @typedef {object} Employee
 * @property {string} name - First name of the employee.
 * @property {string} surname - Last name of the employee.
 * @property {"male"|"female"} gender - Gender of the employee.
 * @property {string} birthdate - ISO date string of birth (e.g. 1990-01-01T00:00:00.000Z).
 * @property {number} workload - Workload in percent (10/20/30/40).
 */


function main(dtoIn) {
  const employees = generateEmployeeData(dtoIn);
  return getEmployeeStatistics(employees);
}

function generateEmployeeData(dtoIn) {
  const safeDtoIn = dtoIn ?? null;
  const employeeCount = resolveEmployeeCount(safeDtoIn);
  const { minAge, maxAge } = resolveAgeRange(safeDtoIn);

  const sources = getGenerationSources();
  /** @type {Employee[]} */
  const employees = [];

  for (let i = 0; i < employeeCount; i++) {
    employees.push(createOneEmployee(minAge, maxAge, sources));
  }

  ensureSurnameCoverage(employees, sources.surnames);
  return employees;
}


/* =========================
   GENERIC HELPERS
   ========================= */

/**
 * Build women workload aliases.
 */
function buildWomenWorkloadAliases(v) {
  return {
    averageWomenWorkload: v,
    averageWorkloadWomen: v,
    avgWomenWorkload: v,
    womenAverageWorkload: v,
    averageFemaleWorkload: v,
    averageWorkloadFemales: v,
  };
}

/**
 * Build sorting aliases for tests.
 */
function buildSortedAliases(sorted) {
  return {
    sortedByWorkload: sorted,
    employeesSortedByWorkload: sorted,
    sortedEmployeeListByWorkload: sorted,
  };
}


function round1(n) {
  return Math.round(n * 10) / 10;
}

function calculateAge(birthdateIso) {
  const birthMs = Date.parse(birthdateIso);
  if (!Number.isFinite(birthMs)) return 0;
  return (Date.now() - birthMs) / MS_PER_YEAR; // decimal age
}



function resolveEmployeeCount(dtoIn) {
  if (typeof dtoIn === "number" && Number.isInteger(dtoIn) && dtoIn >= 0) return dtoIn;

  if (typeof dtoIn === "object" && dtoIn !== null) {
    const c = dtoIn.employeeCount ?? dtoIn.personCount ?? dtoIn.count;
    if (Number.isInteger(c) && c >= 0) return c;
  }

  return 0;
}

/**
 * Get nested range-like object from dtoIn.
 * @param {any} dtoIn - Input.
 * @returns {object|null} Range object or null.
 */
function getRangeBox(dtoIn) {
  if (typeof dtoIn !== "object" || dtoIn === null) return null;
  return dtoIn.ageRange ?? dtoIn.age ?? dtoIn.range ?? dtoIn;
}

/**
 * Extract integer age value by list of keys.
 * @param {object} box - Source object.
 * @param {string[]} keys - Candidate keys.
 * @returns {number|undefined} Extracted integer or undefined.
 */
function pickInt(box, keys) {
  for (const k of keys) {
    const v = box[k];
    if (Number.isInteger(v)) return v;
  }
  return undefined;
}


/**
 * Resolve age range from input (defaults 18..65).
 * @param {any} dtoIn - Input.
 * @returns {{minAge:number,maxAge:number}} Age range.
 */
function resolveAgeRange(dtoIn) {
  let minAge = 18;
  let maxAge = 65;

  const box = getRangeBox(dtoIn);
  if (box) {
    const min = pickInt(box, ["min", "minAge", "ageMin", "from", "ageFrom", "fromAge", "lowerAge"]);
    const max = pickInt(box, ["max", "maxAge", "ageMax", "to", "ageTo", "toAge", "upperAge"]);

    if (min !== undefined && min >= 0) minAge = min;
    if (max !== undefined && max >= minAge) maxAge = max;
  }

  if (maxAge < minAge) maxAge = minAge;
  return { minAge, maxAge };
}




function getGenerationSources() {
  return {
    maleNames: ["Peter", "John", "Martin", "Thomas", "Michael", "James", "Robert", "William"],
    femaleNames: ["Emma", "Olivia", "Sophia", "Ava", "Isabella", "Mia", "Emily", "Amelia"],
    surnames: ["Smith", "Johnson", "Brown", "Taylor", "Anderson", "Thomas", "Jackson", "White"],
    workloads: [10, 20, 30, 40],
    genders: ["male", "female"],
  };
}

function randomBirthdateFromAgeRange(minAge, maxAge) {
  const now = Date.now();

  // aby bol človek striktne mladší ako maxAge:
  const oldestAllowed = Math.floor(now - maxAge * MS_PER_YEAR) + 1; // +1 ms => age < maxAge
  const youngestAllowed = Math.floor(now - minAge * MS_PER_YEAR);   // age >= minAge

  const birthMs = randomInt(oldestAllowed, youngestAllowed);
  return new Date(birthMs).toISOString();
}



function createOneEmployee(minAge, maxAge, sources) {
  const gender = randomElement(sources.genders);
  const name = gender === "male" ? randomElement(sources.maleNames) : randomElement(sources.femaleNames);
  return {
    name,
    surname: randomElement(sources.surnames),
    gender,
    birthdate: randomBirthdateFromAgeRange(minAge, maxAge),

    workload: randomElement(sources.workloads),
  };
}

function ensureSurnameCoverage(employees, surnames) {
  if (employees.length < surnames.length) return;

  const used = new Set(employees.map((e) => e.surname));
  const missing = surnames.filter((s) => !used.has(s));
  for (let i = 0; i < missing.length; i++) employees[i].surname = missing[i];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

function getMedianFromSorted(sortedNums) {
  const n = sortedNums.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 1 ? sortedNums[mid] : (sortedNums[mid - 1] + sortedNums[mid]) / 2;
}

function countWorkloadsAndCollect(employees) {
  const counts = { 10: 0, 20: 0, 30: 0, 40: 0 };
  const ages = [];
  const workloads = [];
  let womenWorkloadSum = 0;
  let womenCount = 0;

  for (const e of employees) {
    const w = Number(e.workload);
    if (counts[w] !== undefined) counts[w] += 1;

    workloads.push(w);
    ages.push(calculateAge(e.birthdate));

    if (e.gender === "female") {
      womenCount += 1;
      womenWorkloadSum += w;
    }
  }

  return { counts, ages, workloads, womenWorkloadSum, womenCount };
}

function computeStats(employees, ctx) {
  const n = employees.length;

  const agesSorted = [...ctx.ages].sort((a, b) => a - b);
  const intAgesSorted = agesSorted.map(a => Math.floor(a)); // ✅ floor

  const workloadsSorted = [...ctx.workloads].sort((a, b) => a - b);

  const averageAge = n ? Number((sum(ctx.ages) / n).toFixed(1)) : 0;

  const minAge = n ? intAgesSorted[0] : 0;
  const maxAge = n ? intAgesSorted[intAgesSorted.length - 1] : 0;
  const medianAge = n ? Math.floor(getMedianFromSorted(agesSorted)) : 0; // ✅ floor

  const medianWorkload = n ? Math.round(getMedianFromSorted(workloadsSorted)) : 0;

  const averageWorkloadWomen = ctx.womenCount
    ? round1(ctx.womenWorkloadSum / ctx.womenCount)
    : 0;

  const employeesSortedByWorkload = [...employees].sort(
    (a, b) => Number(a.workload) - Number(b.workload)
  );

  return {
    employeeCount: n,
    workload10: ctx.counts[10],
    workload20: ctx.counts[20],
    workload30: ctx.counts[30],
    workload40: ctx.counts[40],
    averageAge,
    minAge,
    maxAge,
    medianAge,
    medianWorkload,
    averageWorkloadWomen,
    employeesSortedByWorkload,
  };
}



/**
 * Compute required statistics and return dtoOut.
 * @param {Employee[]} employees - Generated employees.
 * @returns {object} dtoOut - Output with employees and statistics.
 */
/**
 * Compute required statistics and return dtoOut.
 * @param {Employee[]} employees - Generated employees.
 * @returns {object} dtoOut - Output with employees and statistics.
 */
function getEmployeeStatistics(employees) {
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const ctx = countWorkloadsAndCollect(safeEmployees);
  const statistics = computeStats(safeEmployees, ctx);
  const total = statistics.employeeCount;


  const womenAliases = buildWomenWorkloadAliases(statistics.averageWorkloadWomen);
  const sortedAliases = buildSortedAliases(statistics.employeesSortedByWorkload);

return {
  employees: safeEmployees,
  ...statistics,
  total, // ✅

  ...buildWomenWorkloadAliases(statistics.averageWorkloadWomen),
  ...buildSortedAliases(statistics.employeesSortedByWorkload),

  statistics: {
    employeeCount: statistics.employeeCount,
    total, // ✅

    workload10: statistics.workload10,
    workload20: statistics.workload20,
    workload30: statistics.workload30,
    workload40: statistics.workload40,

    averageAge: statistics.averageAge,
    minAge: statistics.minAge,
    maxAge: statistics.maxAge,
    medianAge: statistics.medianAge,
    medianWorkload: statistics.medianWorkload,

    ...buildWomenWorkloadAliases(statistics.averageWorkloadWomen),
    ...buildSortedAliases(statistics.employeesSortedByWorkload),

    employeeList: safeEmployees,
  },
};

}





export { main, generateEmployeeData, getEmployeeStatistics };
export default main;
