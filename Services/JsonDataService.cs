using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text.Json;
using RhythmLibraryWeb.Models;

namespace RhythmLibraryWeb.Services
{
    public class JsonDataService
    {
        private readonly HttpClient _http;

        private static readonly string[] PatternNames =
            { "BN16", "CV16", "DST16", "DW16", "GK16_1", "GK16_2", "GK16_3", "GK16_4", "GK16_5", "GK32", "GKT16", "JR16", "JW16", "JWT16", "PSS32_1", "PST16", "SG16", "SGR16_1", "SGR16_2", "SGR16_3", "SGR16_4", "SP16", "TB16", "TBT16" };

        private static readonly Dictionary<string, string> DisplayNames = new()
        {
            { "BN16",    "BN 16th Notes"              },
            { "CV16",    "Carlos Vega Triplets"        },
            { "DST16",   "DS Triplets"                 },
            { "DW16",    "Dave Weckl Triplets"         },
            { "GK16_1",  "GK 16ths 1"                 },
            { "GK16_2",  "GK 16ths 2"                 },
            { "GK16_3",  "GK 16ths 3"                 },
            { "GK16_4",  "GK 16ths 4"                 },
            { "GK16_5",  "GK 16ths 5"                 },
            { "GK32",    "GK 32nds"                    },
            { "GKT16",   "GK Triplets"                 },
            { "JR16",    "JR 16th Notes"               },
            { "JW16",    "JW 16th Notes"               },
            { "JWT16",   "JW Triplets"                 },
            { "PSS32_1", "PS 32nds I"                  },
            { "PST16",   "PS Triplets"                 },
            { "SG16",    "SG 16th Notes"               },
            { "SGR16_1", "SG Ratamacue I"              },
            { "SGR16_2", "SG Ratamacue II"             },
            { "SGR16_3", "SG Ratamacue III"            },
            { "SGR16_4", "SG Ratamacue IV"             },
            { "SP16",    "SP 16th Notes"               },
            { "TB16",    "TB 16th Notes"               },
            { "TBT16",   "Tom Brechtlein Triplets"     },
        };

        private static readonly string[] RhythmNames =
            { "ThreeCamps", "CommonPhrases", "HalfNotesQuarterNotes", "DottedQuarterQuarterNotes",
              "HalfNotesDottedQuarterNotes", "HalfNotesDottedQuartersQuarterNotes", "SixteenBarExercise",
              "QuarterNotesEighthNotes", "DottedQuarterNotesEighthNotes", "HalfNotesEighthNotes",
              "ThreeCampsSolo", "HalfNotesQuarterNotesCombinations", "HalfNotesQuarterNotesCombinations2",
              "DottedQuartersQuarterNotesCombinations" };

        private static readonly Dictionary<string, string> RhythmDisplayNames = new()
        {
            { "ThreeCamps",                          "Three Camps"                              },
            { "CommonPhrases",                       "Common Phrases"                           },
            { "HalfNotesQuarterNotes",               "Half Notes & Quarter Notes"               },
            { "DottedQuarterQuarterNotes",           "Dotted Quarter & Quarter Notes"           },
            { "HalfNotesDottedQuarterNotes",         "Half Notes & Dotted Quarter Notes"        },
            { "HalfNotesDottedQuartersQuarterNotes", "Half Notes, Dotted Quarters, & Quarters"  },
            { "SixteenBarExercise",                  "Sixteen Bar Exercise"                     },
            { "QuarterNotesEighthNotes",             "Quarter Notes & Eighth Notes"             },
            { "DottedQuarterNotesEighthNotes",       "Dotted Quarter Notes & Eighth Notes"      },
            { "HalfNotesEighthNotes",                "Half Notes & Eighth Notes"                },
            { "ThreeCampsSolo",                      "Three Camps Solo"                         },
            { "HalfNotesQuarterNotesCombinations",   "Half Notes & Quarter Notes Combinations"  },
            { "HalfNotesQuarterNotesCombinations2",  "Half Notes & Quarter Notes Combinations II" },
            { "DottedQuartersQuarterNotesCombinations", "Dotted Quarters & Quarter Notes Combinations" },
        };

        public JsonDataService(HttpClient http) => _http = http;

        public IReadOnlyList<string> AvailablePatterns => PatternNames;
        public IReadOnlyList<string> AvailableRhythms  => RhythmNames;

        public string GetDisplayName(string key) =>
            DisplayNames.TryGetValue(key, out var name) ? name : key;

        public string GetRhythmDisplayName(string key) =>
            RhythmDisplayNames.TryGetValue(key, out var name) ? name : key;

        public string GetKeyFromDisplay(string display) {
            foreach (var kv in DisplayNames)
                if (kv.Value == display) return kv.Key;
            return display;
        }

        public string GetRhythmKeyFromDisplay(string display) {
            foreach (var kv in RhythmDisplayNames)
                if (kv.Value == display) return kv.Key;
            return display;
        }

        public async Task<GK16Data> LoadPatternAsync(string name)
        {
            try
            {
                var json = await _http.GetStringAsync($"data/Patterns/{name}.json");
                return JsonSerializer.Deserialize<GK16Data>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading pattern {name}: {ex.Message}");
                return null;
            }
        }

        public async Task<ThreeCampsData> LoadRhythmAsync(string name)
        {
            try
            {
                var json = await _http.GetStringAsync($"data/Rhythms/{name}.json");
                return JsonSerializer.Deserialize<ThreeCampsData>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading rhythm {name}: {ex.Message}");
                return null;
            }
        }
    }
}
