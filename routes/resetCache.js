const express = require('express');
const router = express.Router();

router.get("/cache/reset",(req, res) => {
  (async ()=>{
    res.type("html");
    res.end(`
    <script>
    caches.delete("cache1")
    .then(()=>{
      location.href = "/"
    })
    .catch(e=>{
      alert(e)
    })
    </script>
    `);
  })()
    .catch((e)=>{
      const code = e.code || 500;
      res.status(code).end(e.toString());
      console.log(e);
    });
});

module.exports = router;