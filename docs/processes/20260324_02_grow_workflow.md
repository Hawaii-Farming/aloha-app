# Grow Module — Activity Workflows

This document describes how the four main grow activities (seeding, harvesting, scouting, and spraying) flow through the system using the shared `ops_task_tracker` as the activity header.

---

## 1. Activity Pattern

All grow activities follow the same pattern:

1. Create an **ops_task_tracker** record (select task, farm, site, start time)
2. Fill in the **grow-specific data** in the relevant tables
3. Complete the activity (stop time, status)

The `ops_task_tracker` captures the common activity metadata (who, when, where). The grow tables capture the domain-specific details.

### Required Pre-Seeded Tasks

The following tasks must be seeded in `ops_task` during org provisioning for the grow workflows to function:

| id | name |
|---|---|
| seeding | Seeding |
| harvesting | Harvesting |
| scouting | Scouting |
| spraying | Spraying |

Without these tasks, users cannot create the corresponding activities.

---

## 2. Seeding

**Tables:** `grow_seeding`

**Flow:**
1. Create an ops_task_tracker activity with task = "Seeding"
2. Create a `grow_seeding` record linked to the activity via `ops_task_tracker_id`
3. Select either a single seed item (`invnt_item_id`) or a seed mix (`grow_seed_mix_id`) — never both
4. Enter batch code (system-generated, editable), seeding UOM, number of units, seeds per unit, number of rows
5. Enter seeding date, transplant date, and estimated harvest date
6. Optionally link to a trial type (`grow_trial_type_id`)
7. Update status through lifecycle: `planned` → `seeded` → `transplanted` → `harvesting` → `harvested`

**Note:** A seeding activity can produce multiple batches if different varieties or mixes are seeded in the same session. Each batch gets its own `grow_seeding` row linked to the same `ops_task_tracker`.

---

## 3. Harvesting

**Tables:** `grow_harvesting`, `grow_harvesting_weight`

**Flow:**
1. Create an ops_task_tracker activity with task = "Harvesting"
2. Create a `grow_harvesting` record linked to the activity via `ops_task_tracker_id`
3. Select the seeding batch being harvested (`grow_seeding_id`) — this provides full seed-to-harvest traceability
4. Optionally assign a harvest grade (`grow_grade_id`)
5. Enter the harvest date
6. Add weigh-in records in `grow_harvesting_weight`:
   - Select a container type (`grow_harvest_container_id`)
   - Enter number of containers and gross weight
   - Tare weight is calculated on the fly from `grow_harvest_container.tare_weight × number_of_containers`
   - Net weight = gross weight minus calculated tare
7. Multiple weigh-ins per harvest are supported (e.g. 20 totes + 2 pallets)

**Note:** Harvest totals (total gross, total net, total containers) are derived by summing across `grow_harvesting_weight` rows. No totals are stored on the header.

---

## 4. Scouting

**Tables:** `grow_scouting_seeding`, `grow_scouting_observation`, `grow_scouting_observation_row`, `grow_scouting_photo`

**Flow:**
1. Create an ops_task_tracker activity with task = "Scouting" (captures farm, site, date, start/stop time)
2. Link the seeding batches being inspected via `grow_scouting_seeding` (one row per batch)
3. For each pest or disease found, create a `grow_scouting_observation` record:
   - Set `observation_type` to `pest` or `disease`
   - Select the pest (`grow_pest_id`) or disease (`grow_disease_id`) from the lookup
   - Enter which side of the site (e.g. East, West)
   - Set severity level (`low`, `moderate`, `high`, `severe`)
   - For diseases, set infection stage (`early`, `mid`, `late`, `advanced`)
4. For each observation, log which rows are affected via `grow_scouting_observation_row` (one row per growing row number)
5. Upload photos via `grow_scouting_photo` linked to the activity (one row per photo with optional caption)

**Note:** There is no separate scouting header table. The `ops_task_tracker` serves as the header since scouting has no additional header-level business fields beyond what the tracker already captures (org, farm, site, date, notes, start/stop time).

---

## 5. Spraying

**Tables:** `grow_spraying_seeding`, `grow_spraying_input`, `grow_spraying_equipment`

**Flow:**
1. Create an ops_task_tracker activity with task = "Spraying" (captures farm, site, date, start/stop time)
2. Attach a pre-spray checklist template (`ops_template`) to the tracker — fill out the safety checklist via `ops_response`
3. Link the seeding batches being treated via `grow_spraying_seeding` (one row per batch)
4. For each chemical or fertilizer applied, create a `grow_spraying_input` record:
   - Select the inventory item (`invnt_item_id`)
   - Optionally link to the active compliance record (`grow_input_compliance_id`) for PHI/REI lookup
   - Enter the target pest/disease, application UOM, and quantity applied
5. For each piece of equipment used, create a `grow_spraying_equipment` record:
   - Select the equipment (`equipment_id`)
   - Enter water UOM and quantity

**Note:** There is no separate spraying header table — same reasoning as scouting. The `ops_task_tracker` captures all header-level data. PHI/REI safety intervals are derived on the fly by taking the maximum across all `grow_spraying_input` rows via their linked `grow_input_compliance` records.

---

## 6. Why Some Activities Have Headers and Others Don't

| Activity | Header table | Reason |
|----------|-------------|--------|
| Seeding | `grow_seeding` | Carries batch code, seed item/mix, UOM, units, dates, status — none of these exist on ops_task_tracker |
| Harvesting | `grow_harvesting` | Carries seeding link, grade, harvest date — traceability and grading are harvest-specific |
| Scouting | None (uses `ops_task_tracker` directly) | All header data (site, date, notes) is already on ops_task_tracker |
| Spraying | None (uses `ops_task_tracker` directly) | All header data (site, date, notes, start/stop) is already on ops_task_tracker; pre-spray checklist uses ops_template |

---

## 7. Flow Diagram

```mermaid
flowchart TD
    A[Create ops_task_tracker Activity] --> B{Task Type?}
    B -->|Seeding| C[Create grow_seeding record]
    C --> C1[Select seed item or mix]
    C1 --> C2[Enter batch code, UOM, units, dates]
    C2 --> C3[Track status: planned → seeded → transplanted → harvested]

    B -->|Harvesting| D[Create grow_harvesting record]
    D --> D1[Link to grow_seeding batch]
    D1 --> D2[Assign grade]
    D2 --> D3[Add weigh-ins via grow_harvesting_weight]
    D3 --> D4[Select container, enter count + gross weight]
    D4 --> D5[Tare auto-calculated, net = gross - tare]

    B -->|Scouting| E[Link seeding batches via grow_scouting_seeding]
    E --> F[Add observations via grow_scouting_observation]
    F --> F1[Select pest or disease + severity + side]
    F1 --> F2[Log affected rows via grow_scouting_observation_row]
    F2 --> F3[Upload photos via grow_scouting_photo]

    B -->|Spraying| G[Fill pre-spray checklist via ops_template]
    G --> G1[Link seeding batches via grow_spraying_seeding]
    G1 --> G2[Add inputs via grow_spraying_input]
    G2 --> G3[Select chemical + compliance + quantity]
    G3 --> G4[Add equipment via grow_spraying_equipment]
    G4 --> G5[Select equipment + water UOM + quantity]
    G5 --> G6[PHI/REI derived from inputs on the fly]
```
