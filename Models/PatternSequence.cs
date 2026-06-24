using System.Collections.Generic;
using System.Linq;

namespace RhythmLibraryWeb.Models
{
    public class PatternSequence
    {
        public string Title { get; set; }
        public List<RhythmPattern> Patterns { get; set; } = new List<RhythmPattern>();
        public List<int> Sequence { get; set; } = new List<int>();

        // Maps each position in Sequence back to its original measure index in the Rhythm array.
        // Used so the playhead highlight finds the correct row even during repeated passes.
        public List<int> OriginalIndices { get; private set; } = new List<int>();

        // When true, PatternPlayerService loops the sequence until cancelled.
        public bool ShouldLoop { get; private set; }

        public PatternSequence(ThreeCampsData threeCampsData)
        {
            Title    = threeCampsData.Title;
            Patterns = threeCampsData.RhythmPatterns;

            // Collect only the groups whose Repeat checkbox is currently checked
            var checkedGroups = threeCampsData.Groups?
                .Where(g => g.Repeat)
                .ToList();

            if (checkedGroups?.Count > 0)
            {
                // Build sequence from checked groups only; looping is handled by PatternPlayerService
                var seq     = new List<int>();
                var origIdx = new List<int>();

                foreach (var g in checkedGroups)
                {
                    for (int i = g.Start; i < g.Start + g.Length && i < threeCampsData.Rhythm.Count; i++)
                    {
                        seq.Add(threeCampsData.Rhythm[i]);
                        origIdx.Add(i);
                    }
                }

                Sequence        = seq;
                OriginalIndices = origIdx;
                ShouldLoop      = true;
            }
            else
            {
                Sequence        = threeCampsData.Rhythm;
                OriginalIndices = Enumerable.Range(0, threeCampsData.Rhythm.Count).ToList();
                ShouldLoop      = false;
            }
        }

        public PatternSequence()
        {
        }
    }
}

