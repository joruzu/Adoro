module.exports = mongoose => {

  var newsSchema = mongoose.Schema({
    provider: String,
    headline: String,
    link: String,
    content: String,
    imageUrl: String,
    isoDate: Date,
    pubDate: String
  }
  /*
  , { 
    timestamps: true
  }
  */
  );

  newsSchema.method("toJSON", function() {
    const {__v, _id, ...object} = this.toObject();
    object.id = _id;
    return object;
  });

  const News = mongoose.model("news", newsSchema);

  return News;
};